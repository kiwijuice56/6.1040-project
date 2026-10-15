import { join, normalize, sep } from "node:path";

const backend = process.env.BACKEND_URL ?? "http://127.0.0.1:3000";
const dist = join(import.meta.dir, "..", "dist");
const index = join(dist, "index.html");

function proxy(request: Request) {
  const url = new URL(request.url);
  return fetch(new URL(url.pathname + url.search, backend), request).catch(
    () => Response.json({ error: "UNAVAILABLE" }, { status: 503 }),
  );
}

function underDist(pathname: string) {
  const relative = pathname === "/" || pathname === "/auth/commons/callback" ? "index.html" : pathname.slice(1);
  const resolved = normalize(join(dist, decodeURIComponent(relative)));
  const root = dist.endsWith(sep) ? dist : dist + sep;
  if (resolved !== dist && !resolved.startsWith(root)) return undefined;
  return resolved;
}

const server = Bun.serve({
  hostname: process.env.HOST ?? "127.0.0.1",
  port: Number(process.env.PORT ?? 8080),
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/carto-key") {
      return Response.json(
        { key: process.env.CARTO_API_KEY ?? "" },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    if (url.pathname === "/health" || url.pathname.startsWith("/api/")) return proxy(request);

    const target = underDist(url.pathname);
    if (target === undefined) return new Response("Not found", { status: 404 });
    const file = Bun.file(target);
    if (await file.exists()) return new Response(file);
    const homepage = Bun.file(index);
    if (await homepage.exists()) return new Response(homepage);
    return Response.json(
      { error: "Frontend is not built. Run `bun run build:frontend`." },
      { status: 503 },
    );
  },
});

console.log(`Frontend listening on ${server.url}`);
