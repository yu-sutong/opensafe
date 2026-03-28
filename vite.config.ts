import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Simple in-memory state for local development
let localState = { enabled: false };
const localEvents: Array<{ time: string; tag: string; message: string }> = [];

// Mock API plugin for local development
function mockApiPlugin(): Plugin {
  return {
    name: "mock-api",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || "";

        // Mock /api/state
        if (url === "/api/state" || url.startsWith("/api/state?")) {
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
          res.setHeader("Access-Control-Allow-Headers", "Content-Type");

          if (req.method === "OPTIONS") {
            res.end();
            return;
          }

          if (req.method === "POST") {
            let body = "";
            req.on("data", (chunk: Buffer) => (body += chunk.toString()));
            req.on("end", () => {
              try {
                const data = JSON.parse(body);
                if (typeof data.enabled === "boolean") {
                  localState.enabled = data.enabled;
                  localEvents.push({
                    time: new Date().toLocaleTimeString("en-US"),
                    tag: "INBOUND",
                    message: `SafeBrowse ${data.enabled ? "enabled" : "disabled"}`,
                  });
                }
              } catch {
                // ignore parse errors
              }
              res.end(JSON.stringify(localState));
            });
            return;
          }

          res.end(JSON.stringify(localState));
          return;
        }

        // Mock /api/proxy (GET for stats/events)
        if (url === "/api/proxy" || url.startsWith("/api/proxy?")) {
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Access-Control-Allow-Origin", "*");

          if (req.method === "GET") {
            res.end(
              JSON.stringify({
                events: localEvents.slice(-20),
                stats: {
                  threatsNeutralized: 0,
                  extractions: 0,
                  avgLatency: "0.0s",
                },
              })
            );
            return;
          }

          res.statusCode = 405;
          res.end(JSON.stringify({ error: "Use vercel dev for full API" }));
          return;
        }

        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    mode === "development" && mockApiPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
}));
