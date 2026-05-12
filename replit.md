# Montreal Building Permit MCP Server

A Python MCP (Model Context Protocol) server that fetches and filters Montreal building permit data from the city's Open Data portal, making it available as callable tools for AI assistants like Claude.

## Run & Operate

- `python mcp-montreal-permits/server.py` — start the MCP server (stdio transport)
- MCP clients (e.g. Claude Desktop) connect by spawning the process as a subprocess

## Stack

- Python 3.12
- `fastmcp` 3.x — high-level MCP server framework (bundles `mcp`)
- `pandas` — CSV filtering and data processing
- `requests` — HTTP download of the permit CSV

## Where things live

- `mcp-montreal-permits/server.py` — all tool definitions and data logic
- `mcp-montreal-permits/requirements.txt` — Python dependencies
- `mcp-montreal-permits/README.md` — usage, Claude Desktop config, column reference

## Architecture decisions

- **Session-level CSV cache**: The 550k-row CSV (~79 MB ZIP) is downloaded once on first tool call and held in memory for the session. Call `reload_data()` to force a refresh.
- **User-Agent required**: The Montreal Open Data server returns 403/RBAC errors without a browser-like User-Agent; the requests session sets one explicitly.
- **Cost column absent**: The current Open Data CSV does not publish `cout_travaux_estimes`. `get_high_value_permits` uses `nb_logements` as a proxy and documents this clearly; it will automatically switch to cost if the column appears.
- **Partial borough matching**: `get_recent_permits` uses case-insensitive `str.contains`, so "plateau" matches "Le Plateau-Mont-Royal".

## Product

Four MCP tools:

| Tool | What it does |
|------|--------------|
| `get_recent_permits(borough, days=7)` | Permits issued in a borough in the last N days |
| `get_high_value_permits(min_cost=100000)` | Large-scale permits by unit count (cost proxy) |
| `list_boroughs()` | Lists all 19 distinct boroughs in the dataset |
| `reload_data()` | Clears cache and re-downloads the CSV |

## Gotchas

- Always run `python server.py` from the project root or the `mcp-montreal-permits/` directory — the path in Claude Desktop config must be absolute.
- The first tool call downloads ~79 MB; allow a few seconds for initial load.

## Pointers

- Data source: https://donnees.montreal.ca/dataset/d90eaf1b-2de8-43f0-923a-27a620ecdf41
- CSV resource ID: `5232a72d-235a-48eb-ae20-bb9d501300ad`
