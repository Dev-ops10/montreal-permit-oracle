# Montreal Building Permit MCP Server

[![Smithery](https://smithery.ai/badge/maximeproulx4/MontrealPermitOracle2)](https://smithery.ai/server/maximeproulx4/MontrealPermitOracle2)

An MCP (Model Context Protocol) server that exposes Montreal building permit data from the city's [Open Data portal](https://donnees.montreal.ca) as callable tools for AI assistants.

## Tools

| Tool | Description |
|------|-------------|
| `get_recent_permits(borough, days=7)` | Permits issued in a borough within the last N days |
| `get_high_value_permits(min_cost=100000)` | Large-scale permits filtered by nb_logements (see note below) |
| `list_boroughs()` | All 19 distinct borough names in the dataset |
| `reload_data()` | Clear session cache and re-download the CSV |

### Example output

```
[1]
  Address:      3500 B rue Sainte-Famille
  Borough:      Le Plateau-Mont-Royal
  Type of Work: T1:Transformation ext/PA/PIIA — Au #3592, en façade, au RC, remplacer le balcon…
  Units:        0
  Date Issued:  2026-05-04
```

## Data source

CSV (~550 000 rows) is downloaded on first call and cached for the server session:

```
https://donnees.montreal.ca/dataset/d90eaf1b-2de8-43f0-923a-27a620ecdf41/
  resource/5232a72d-235a-48eb-ae20-bb9d501300ad/download/permis-construction.csv
```

### Actual CSV columns

| CSV column | Used for |
|------------|---------|
| `arrondissement` | Borough filter in `get_recent_permits` |
| `date_emission` | Date filter in `get_recent_permits` |
| `emplacement` | Address in output |
| `description_type_demande` | Type of work (primary) |
| `nature_travaux` | Type of work (detail) |
| `description_type_batiment` | Building category |
| `nb_logements` | Housing unit count (proxy for scale) |

> **Note on `cout_travaux_estimes`:** The estimated work cost column is not
> published in the current Open Data CSV. `get_high_value_permits` uses
> `nb_logements` (units) as a proxy: `min_cost=500000` → `nb_logements ≥ 5`.
> If the dataset is updated to include cost data the tool will use it automatically.

## Running

```bash
# stdio transport (default) — MCP clients spawn this as a subprocess
python server.py
```

## Adding to Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or  
`%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "montreal-permits": {
      "command": "python",
      "args": ["/absolute/path/to/mcp-montreal-permits/server.py"]
    }
  }
}
```

Then restart Claude Desktop. You can ask it things like:
- *"Show me recent building permits in Rosemont"*
- *"What are the largest construction projects in Montreal?"*
- *"What permits were issued in Verdun in the last 30 days?"*

## Quick smoke-test

```bash
python3 -c "
from server import list_boroughs, get_recent_permits
print(list_boroughs())
print(get_recent_permits('Plateau', days=30))
"
```

## Dependencies

```
fastmcp>=3.0.0   # high-level MCP server framework (bundles mcp)
pandas>=2.0.0    # data filtering and processing
requests>=2.28.0 # HTTP download of the CSV
```

Install:

```bash
pip install fastmcp pandas requests
```
