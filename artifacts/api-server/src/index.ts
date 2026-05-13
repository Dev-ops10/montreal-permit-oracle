import { spawn } from "child_process";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Spawn the Python MCP server in HTTP mode on port 8000
// Resolve workspace root: dist/ → api-server/ → artifacts/ → workspace/
const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const mcpProcess = spawn(
  "python",
  ["mcp-montreal-permits/server.py", "--transport", "http", "--port", "8000"],
  {
    stdio: "inherit",
    detached: false,
    cwd: workspaceRoot,
  },
);

mcpProcess.on("error", (err) => {
  logger.error({ err }, "Failed to start MCP server process");
});

mcpProcess.on("exit", (code, signal) => {
  logger.warn({ code, signal }, "MCP server process exited");
});

process.on("exit", () => {
  mcpProcess.kill();
});

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  logger.info("MCP HTTP server spawned on port 8000");
});
