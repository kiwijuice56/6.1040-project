import homepage from "./index.html";

const backend = process.env.BACKEND_URL ?? "http://127.0.0.1:3000";

// Pass API requests and health checks on to the backend.
function proxy(request: Request) {
  const url = new URL(request.url);
  return fetch(new URL(url.pathname + url.search, backend), request).catch(
    () => Response.json({ error: "UNAVAILABLE" }, { status: 503 }),
  );
}

const server = Bun.serve({
  hostname: process.env.HOST ?? "127.0.0.1",
  port: Number(process.env.PORT ?? 8080),
  // Bun's HTML HMR client can fail to reload `web/index.html` ("Failed to load
  // bundled module"). The page still bundles on each request without it.
  development: { hmr: false },
  routes: {
    "/": homepage,
    "/auth/commons/callback": homepage,
    "/carto-key": () =>
      Response.json(
        { key: process.env.CARTO_API_KEY ?? "" },
        { headers: { "Cache-Control": "no-store" } },
      ),
    "/api/*": proxy,
    "/health": proxy,
  },
});

console.log(`Frontend listening on ${server.url}`);