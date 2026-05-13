"""
Montreal Building Permit MCP Server

Provides tools to query building permit data from the Montreal Open Data portal.
Data source: https://donnees.montreal.ca (dataset d90eaf1b-2de8-43f0-923a-27a620ecdf41)

Real CSV columns
----------------
no_demande, id_permis, date_debut, date_emission, emplacement, arrondissement,
code_type_base_demande, description_type_demande, description_type_batiment,
description_categorie_batiment, nature_travaux, nb_logements, longitude, latitude,
loc_x, loc_y

Note: The Montreal Open Data CSV does not currently publish estimated work cost
(cout_travaux_estimes). The get_high_value_permits tool filters on nb_logements
(number of housing units) as a proxy for project scale and notes this clearly.
"""

from __future__ import annotations

import io
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

import pandas as pd
import requests
from fastmcp import FastMCP
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

CSV_URL = (
    "https://donnees.montreal.ca/dataset/d90eaf1b-2de8-43f0-923a-27a620ecdf41"
    "/resource/5232a72d-235a-48eb-ae20-bb9d501300ad/download/permis-construction.csv"
)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; MontrealPermitsMCP/1.0; "
        "+https://donnees.montreal.ca)"
    )
}

mcp = FastMCP(
    name="montreal-permits",
    instructions=(
        "Tools for querying Montreal building permit data from the city's Open Data portal. "
        "The CSV is downloaded on first use and cached for the server session. "
        "Use reload_data() to force a fresh download."
    ),
)

_cached_df: Optional[pd.DataFrame] = None


def _load_data() -> pd.DataFrame:
    """Download and cache the permit CSV for the session."""
    global _cached_df
    if _cached_df is not None:
        return _cached_df

    response = requests.get(CSV_URL, headers=HEADERS, timeout=120)
    response.raise_for_status()

    df = pd.read_csv(
        io.StringIO(response.content.decode("utf-8", errors="replace")),
        low_memory=False,
    )

    if "date_emission" in df.columns:
        df["date_emission"] = pd.to_datetime(df["date_emission"], errors="coerce")

    if "nb_logements" in df.columns:
        df["nb_logements"] = pd.to_numeric(df["nb_logements"], errors="coerce")

    _cached_df = df
    return df


def _format_permit(row: pd.Series, columns: list[str]) -> str:
    """Render one permit row as a human-readable summary block."""
    address = str(row["emplacement"]).strip() if "emplacement" in columns and pd.notna(row.get("emplacement")) else "N/A"

    work_type_parts = []
    for col in ("description_type_demande", "nature_travaux", "description_type_batiment"):
        if col in columns and pd.notna(row.get(col)):
            work_type_parts.append(str(row[col]).strip())
    work_type = " — ".join(work_type_parts) if work_type_parts else "N/A"

    date_val = row.get("date_emission") if "date_emission" in columns else None
    date_str = pd.Timestamp(date_val).strftime("%Y-%m-%d") if date_val is not None and pd.notna(date_val) else "N/A"

    units = row.get("nb_logements") if "nb_logements" in columns else None
    units_str = f"{int(units):,}" if units is not None and pd.notna(units) else "N/A"

    borough = str(row["arrondissement"]).strip() if "arrondissement" in columns and pd.notna(row.get("arrondissement")) else "N/A"

    return (
        f"  Address:      {address}\n"
        f"  Borough:      {borough}\n"
        f"  Type of Work: {work_type}\n"
        f"  Units:        {units_str}\n"
        f"  Date Issued:  {date_str}"
    )


@mcp.tool()
def get_recent_permits(borough: str, days: int = 7) -> str:
    """
    Return building permits issued in the given Montreal borough within the last N days.

    Args:
        borough: Borough name (arrondissement) — case-insensitive, partial match supported.
                 Examples: "plateau", "rosemont", "verdun", "côte-des-neiges".
                 Use list_boroughs() to see all available names.
        days:    How many days back to search. Defaults to 7.

    Returns:
        Formatted permit summaries (address, type of work, units, date), or a message
        if no matching permits are found.
    """
    if days < 1:
        return "Error: 'days' must be at least 1."

    df = _load_data()
    cols = list(df.columns)

    if "arrondissement" not in cols:
        return f"Error: 'arrondissement' column not found. Available columns: {cols}"
    if "date_emission" not in cols:
        return f"Error: 'date_emission' column not found. Available columns: {cols}"

    cutoff = pd.Timestamp(datetime.now()) - timedelta(days=days)
    borough_mask = df["arrondissement"].astype(str).str.contains(borough, case=False, na=False)
    date_mask = df["date_emission"] >= cutoff

    filtered = df[borough_mask & date_mask].copy()

    if filtered.empty:
        return (
            f"No permits found for borough matching '{borough}' in the last {days} day(s).\n"
            "Tip: use list_boroughs() to see exact borough names in the dataset."
        )

    total = len(filtered)
    filtered = filtered.sort_values("date_emission", ascending=False)

    lines = [f"Found {total} permit(s) for '{borough}' in the last {days} day(s):\n"]
    for i, (_, row) in enumerate(filtered.iterrows(), 1):
        lines.append(f"[{i}]")
        lines.append(_format_permit(row, cols))
        lines.append("")

    return "\n".join(lines).rstrip()


@mcp.tool()
def get_high_value_permits(min_cost: float = 100_000) -> str:
    """
    Return large-scale building permits filtered by estimated work cost.

    IMPORTANT: The Montreal Open Data CSV does not currently publish the estimated
    work cost column (cout_travaux_estimes). As a proxy for project scale this tool
    filters by nb_logements (number of housing units) using min_cost / 100 000 as
    the unit threshold — so min_cost=100000 means "≥ 1 unit", min_cost=500000 means
    "≥ 5 units", etc. Results are sorted by unit count (highest first).

    If the dataset is updated to include a cost column in the future, this tool will
    automatically use it instead.

    Args:
        min_cost: Proxy threshold in CAD. Translated to housing units as min_cost / 100000.
                  Defaults to 100,000 (≥ 1 unit).

    Returns:
        Formatted permit summaries sorted by scale (largest first).
    """
    df = _load_data()
    cols = list(df.columns)

    # If the cost column ever becomes available, use it directly
    if "cout_travaux_estimes" in cols:
        df["cout_travaux_estimes"] = pd.to_numeric(df["cout_travaux_estimes"], errors="coerce")
        filtered = df[df["cout_travaux_estimes"] >= min_cost].copy()
        sort_col = "cout_travaux_estimes"
        label = f"estimated cost ≥ ${min_cost:,.0f}"
    else:
        # Proxy: treat min_cost / 100_000 as minimum housing units
        min_units = max(1, int(min_cost / 100_000))
        if "nb_logements" not in cols:
            return (
                "The dataset does not include 'cout_travaux_estimes' (estimated cost) "
                "or 'nb_logements' (unit count). Cannot filter by value. "
                f"Available columns: {cols}"
            )
        filtered = df[df["nb_logements"] >= min_units].copy()
        sort_col = "nb_logements"
        label = (
            f"nb_logements ≥ {min_units} "
            f"(proxy for min_cost=${min_cost:,.0f}; "
            f"note: cout_travaux_estimes is not in the current dataset)"
        )

    if filtered.empty:
        return f"No permits found with {label}."

    total = len(filtered)
    filtered = filtered.sort_values(sort_col, ascending=False)

    lines = [f"Found {total} permit(s) with {label} (sorted largest first):\n"]
    for i, (_, row) in enumerate(filtered.iterrows(), 1):
        lines.append(f"[{i}]")
        lines.append(_format_permit(row, cols))
        lines.append("")

    return "\n".join(lines).rstrip()


@mcp.tool()
def list_boroughs() -> str:
    """
    List all distinct borough (arrondissement) names in the permit dataset.

    Returns:
        Sorted list of borough names — pass one of these to get_recent_permits().
    """
    df = _load_data()

    if "arrondissement" not in df.columns:
        return f"Error: 'arrondissement' column not found. Available columns: {list(df.columns)}"

    boroughs = sorted(df["arrondissement"].dropna().astype(str).unique().tolist())

    if not boroughs:
        return "No borough names found in the dataset."

    lines = [f"Available boroughs ({len(boroughs)} total):\n"]
    lines += [f"  - {b}" for b in boroughs]
    return "\n".join(lines)


@mcp.tool()
def reload_data() -> str:
    """
    Clear the session cache and re-download the permit CSV from the Open Data portal.

    Returns:
        Confirmation message with row count and column list.
    """
    global _cached_df
    _cached_df = None
    df = _load_data()
    return (
        f"Data reloaded successfully. "
        f"{len(df):,} permits loaded.\n"
        f"Columns: {list(df.columns)}"
    )


_SERVER_CARD_PATH = Path(__file__).parent.parent / ".well-known" / "mcp" / "server-card.json"

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


@mcp.custom_route("/.well-known/mcp/server-card.json", methods=["GET", "OPTIONS"])
async def serve_server_card(request: Request) -> Response:
    """
    Serve the MCP server card for Smithery.ai / MCP.directory discovery.
    Always available when the server runs with HTTP transport.
    """
    if request.method == "OPTIONS":
        return Response(status_code=204, headers=CORS_HEADERS)

    if not _SERVER_CARD_PATH.exists():
        return Response(
            content=json.dumps({"error": "server-card.json not found"}),
            status_code=404,
            media_type="application/json",
            headers=CORS_HEADERS,
        )

    card = json.loads(_SERVER_CARD_PATH.read_text(encoding="utf-8"))
    return JSONResponse(content=card, headers=CORS_HEADERS)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Montreal Building Permit MCP Server")
    parser.add_argument(
        "--transport",
        choices=["stdio", "http"],
        default="stdio",
        help="Transport to use: 'stdio' (default, for Claude Desktop) or 'http' (for remote/Smithery)",
    )
    parser.add_argument(
        "--host",
        default="0.0.0.0",
        help="Host to bind when using HTTP transport (default: 0.0.0.0)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8000,
        help="Port to bind when using HTTP transport (default: 8000)",
    )
    args = parser.parse_args()

    if args.transport == "http":
        mcp.run(transport="streamable-http", host=args.host, port=args.port)
    else:
        mcp.run(transport="stdio")
