import { join, normalize, sep } from "node:path";
import { createGateway } from "@mit-sdg/sync-engine/boundary";
import { createHttpHandler } from "@mit-sdg/sync-engine-http/handler";
import { assembleApplication } from "./assembly.ts";
import { CommonsProvider } from "./concepts/Federating/provider.ts";
import { stickyPolicy } from "./http.ts";
import { db } from "./db.ts";

const publicOrigin = process.env.PUBLIC_ORIGIN ?? "http://127.0.0.1:8080";
const policy = stickyPolicy(publicOrigin);
const application = assembleApplication({
  database: db,
  commons: new CommonsProvider({
    origin: process.env.COMMONS_ORIGIN ?? "https://class.mit-sdg.dev",
    app: publicOrigin,
  }),
});
const gateway = createGateway({ application });
const api = createHttpHandler({ application, gateway, policy });
const dist = join(import.meta.dir, "..", "dist");

function fileUnderDist(pathname: string) {
  const relative = pathname === "/" || pathname === "/auth/commons/callback" ? "index.html" : pathname.slice(1);
  const resolved = normalize(join(dist, decodeURIComponent(relative)));
  const root = dist.endsWith(sep) ? dist : dist + sep;
  if (resolved !== dist && !resolved.startsWith(root)) return undefined;
  return resolved;
}

const server = Bun.serve({
  hostname: process.env.HOST ?? "127.0.0.1",
  port: Number(process.env.PORT ?? 3000),
  routes: {
    "/api/*": api,
    "/carto-key": () =>
      Response.json(
        { key: process.env.CARTO_API_KEY ?? "" },
        { headers: { "Cache-Control": "no-store" } },
      ),
    "/health": async () => {
      try {
        await db.collection("registering.users").findOne({}, { maxTimeMS: 2000, timeoutMS: 3000 });
        return Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
      } catch {
        return Response.json(
          { status: "unavailable" },
          { status: 503, headers: { "Cache-Control": "no-store" } },
        );
      }
    },
  },
  async fetch(request) {
    const target = fileUnderDist(new URL(request.url).pathname);
    if (target === undefined) return new Response("Not found", { status: 404 });
    const file = Bun.file(target);
    if (await file.exists()) return new Response(file);
    const homepage = Bun.file(join(dist, "index.html"));
    if (await homepage.exists()) return new Response(homepage);
    return Response.json({ error: "Frontend is not built. Run `bun run build`." }, { status: 503 });
  },
});

console.log(`Sticky listening on ${server.url}`);
