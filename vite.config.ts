import vue from "@vitejs/plugin-vue";
import { defineConfig, loadEnv, type Plugin, type ProxyOptions } from "vite";

const backend = process.env.BACKEND_URL ?? "http://127.0.0.1:3000";
const proxy: Record<string, ProxyOptions> = {
  "/api": backend,
  "/health": backend,
};

/** Serves the CARTO key from the environment, never the client bundle. Same route as the old Bun frontend server. */
function cartoKey(key: string): Plugin {
  const send = (res: { setHeader(name: string, value: string): void; end(body: string): void }) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify({ key }));
  };
  return {
    name: "carto-key",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split("?")[0] !== "/carto-key") return next();
        send(res);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split("?")[0] !== "/carto-key") return next();
        send(res);
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    root: "web",
    envDir: process.cwd(),
    plugins: [vue(), cartoKey(env.CARTO_API_KEY ?? process.env.CARTO_API_KEY ?? "")],
    server: {
      host: process.env.HOST ?? "127.0.0.1",
      port: Number(process.env.PORT ?? 8080),
      proxy,
    },
    preview: {
      host: process.env.HOST ?? "127.0.0.1",
      port: Number(process.env.PORT ?? 8080),
      proxy,
    },
    build: {
      outDir: "../dist",
      emptyOutDir: true,
    },
  };
});
