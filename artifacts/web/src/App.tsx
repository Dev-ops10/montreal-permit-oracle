import { MapPin, Calendar, DollarSign, List, RefreshCw, Github, Terminal, Copy, Check } from "lucide-react";
import { useState } from "react";

const tools = [
  {
    name: "get_recent_permits",
    icon: Calendar,
    signature: 'get_recent_permits(borough, days=7)',
    description: "Fetch building permits issued in a given Montreal borough within the last N days. Borough matching is case-insensitive and partial (e.g. \"plateau\" matches \"Le Plateau-Mont-Royal\").",
    example: '"Show me permits in Rosemont from the last 14 days"',
  },
  {
    name: "get_high_value_permits",
    icon: DollarSign,
    signature: "get_high_value_permits(min_cost=100000)",
    description: "Return large-scale construction projects filtered by estimated cost. Results sorted by project scale, largest first.",
    example: '"What are the biggest construction projects in Montreal?"',
  },
  {
    name: "list_boroughs",
    icon: List,
    signature: "list_boroughs()",
    description: "List all 19 distinct borough (arrondissement) names available in the dataset — useful as input to get_recent_permits().",
    example: '"Which boroughs does the permit data cover?"',
  },
  {
    name: "reload_data",
    icon: RefreshCw,
    signature: "reload_data()",
    description: "Clear the session cache and re-download the latest permit CSV from the Montreal Open Data portal.",
    example: '"Refresh the permit data"',
  },
];

const configSnippet = `{
  "mcpServers": {
    "montreal-permits": {
      "command": "python",
      "args": ["/path/to/mcp-montreal-permits/server.py"]
    }
  }
}`;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="absolute top-3 right-3 p-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors text-white/60 hover:text-white"
      title="Copy"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-white font-sans">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <MapPin size={20} className="text-[#58a6ff]" />
            <span className="font-semibold text-sm tracking-wide">Montreal Permit Oracle</span>
          </div>
          <a
            href="https://github.com/Dev-ops10/montreal-permit-oracle"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white/90 transition-colors"
          >
            <Github size={16} />
            <span>GitHub</span>
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#58a6ff]/10 border border-[#58a6ff]/20 text-[#58a6ff] text-xs font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#58a6ff] animate-pulse" />
          MCP Server · v1.0.0 · Protocol 2025-06-18
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-5 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
          Montreal Construction Oracle
        </h1>

        <p className="text-lg text-white/50 max-w-2xl mx-auto leading-relaxed">
          An MCP server that gives AI assistants real-time access to{" "}
          <span className="text-white/80">550 000+</span> building permits from the City of Montréal's Open Data portal.
        </p>

        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <a
            href="#setup"
            className="px-5 py-2.5 rounded-lg bg-[#58a6ff] hover:bg-[#79b8ff] text-[#0d1117] font-semibold text-sm transition-colors"
          >
            Add to Claude Desktop
          </a>
          <a
            href="#tools"
            className="px-5 py-2.5 rounded-lg bg-white/8 hover:bg-white/12 border border-white/10 text-white/80 text-sm transition-colors"
          >
            View Tools
          </a>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-white/8 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-6 py-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { label: "Permits indexed", value: "550 000+" },
            { label: "Boroughs covered", value: "19" },
            { label: "Years of history", value: "30+" },
            { label: "MCP tools", value: "4" },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-xs text-white/40 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Tools */}
      <section id="tools" className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-xl font-semibold mb-2">Tools</h2>
        <p className="text-white/40 text-sm mb-10">Four tools your AI assistant can call directly.</p>

        <div className="grid sm:grid-cols-2 gap-4">
          {tools.map(({ name, icon: Icon, signature, description, example }) => (
            <div
              key={name}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-5 hover:border-white/20 transition-colors"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 rounded-lg bg-[#58a6ff]/10 text-[#58a6ff] shrink-0">
                  <Icon size={16} />
                </div>
                <div>
                  <div className="font-mono text-sm text-white/90 font-medium">{name}</div>
                  <div className="font-mono text-xs text-white/30 mt-0.5">{signature}</div>
                </div>
              </div>
              <p className="text-sm text-white/50 leading-relaxed mb-3">{description}</p>
              <div className="text-xs text-white/30 italic border-l-2 border-white/10 pl-3">
                {example}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Setup */}
      <section id="setup" className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-xl font-semibold mb-2">Setup</h2>
        <p className="text-white/40 text-sm mb-10">Get running in under two minutes.</p>

        <div className="space-y-6">
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#58a6ff]/10 border border-[#58a6ff]/20 flex items-center justify-center text-[#58a6ff] text-sm font-semibold">1</div>
            <div className="flex-1">
              <div className="font-medium text-white/80 mb-2">Install dependencies</div>
              <div className="relative rounded-lg bg-[#161b22] border border-white/10 p-4 font-mono text-sm text-white/70">
                <CopyButton text="pip install fastmcp pandas requests" />
                <span className="text-white/30 select-none">$ </span>pip install fastmcp pandas requests
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#58a6ff]/10 border border-[#58a6ff]/20 flex items-center justify-center text-[#58a6ff] text-sm font-semibold">2</div>
            <div className="flex-1">
              <div className="font-medium text-white/80 mb-2">Add to Claude Desktop config</div>
              <p className="text-sm text-white/40 mb-2">
                Edit{" "}
                <code className="text-white/60 bg-white/8 px-1 py-0.5 rounded text-xs">
                  ~/Library/Application Support/Claude/claude_desktop_config.json
                </code>
              </p>
              <div className="relative rounded-lg bg-[#161b22] border border-white/10 p-4 font-mono text-sm text-white/70">
                <CopyButton text={configSnippet} />
                <pre className="whitespace-pre-wrap text-xs leading-relaxed">{configSnippet}</pre>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#58a6ff]/10 border border-[#58a6ff]/20 flex items-center justify-center text-[#58a6ff] text-sm font-semibold">3</div>
            <div className="flex-1">
              <div className="font-medium text-white/80 mb-2">Restart Claude Desktop and ask away</div>
              <div className="grid sm:grid-cols-2 gap-2">
                {[
                  "Show me recent permits in Le Plateau-Mont-Royal",
                  "What are the largest construction projects in Ville-Marie?",
                  "List all Montreal boroughs in the permit data",
                  "Any new permits in Rosemont in the last 30 days?",
                ].map((q) => (
                  <div key={q} className="flex items-start gap-2 rounded-lg bg-white/[0.03] border border-white/8 px-3 py-2.5">
                    <Terminal size={13} className="text-[#58a6ff] mt-0.5 shrink-0" />
                    <span className="text-xs text-white/50 italic">{q}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Data source */}
      <section className="border-t border-white/8 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-white/70 mb-1">Data source</div>
            <div className="text-xs text-white/30">
              City of Montréal Open Data · ~79 MB CSV · License OGL-Canada-2.0
            </div>
          </div>
          <a
            href="https://donnees.montreal.ca/dataset/d90eaf1b-2de8-43f0-923a-27a620ecdf41"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#58a6ff] hover:underline shrink-0"
          >
            donnees.montreal.ca →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/8">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-white/20">
          <span>Montreal Construction Oracle · MCP Protocol 2025-06-18</span>
          <div className="flex items-center gap-4">
            <a
              href="https://smithery.ai/servers/maximeproulx4/MontrealPermitOracle2"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/50 transition-colors"
            >
              Listed on Smithery
            </a>
            <span>Data © Ville de Montréal</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
