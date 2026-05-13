import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { createProxyMiddleware } from "http-proxy-middleware";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Proxy /mcp/* to the Python fastmcp HTTP server.
// Use pathFilter (not a mount path) so Express does NOT strip the /mcp prefix —
// fastmcp's streamable-http transport listens at /mcp itself.
app.use(
  createProxyMiddleware({
    target: "http://localhost:8000",
    changeOrigin: true,
    pathFilter: "/mcp",
    on: {
      error(err, _req, res) {
        logger.error({ err }, "MCP proxy error");
        if (res && "writeHead" in res && typeof (res as any).writeHead === "function") {
          (res as any).writeHead(502, { "Content-Type": "application/json" });
          (res as any).end(JSON.stringify({ error: "MCP server unavailable" }));
        }
      },
    },
  }),
);

export default app;
