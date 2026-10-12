import { createGateway } from "@mit-sdg/sync-engine/boundary";
import { createHttpHandler } from "@mit-sdg/sync-engine-http/handler";
import { assembleApplication } from "./assembly.ts";
import { MemoryProvider } from "./concepts/Federating/provider.ts";
import { stickyPolicy } from "./http.ts";
import { db } from "./db.ts";

const policy = stickyPolicy(process.env.PUBLIC_ORIGIN ?? "http://127.0.0.1:8080");
const application = assembleApplication({ database: db, commons: new MemoryProvider() });
const gateway = createGateway({ application });
const api = createHttpHandler({ application, gateway, policy });

const server = Bun.serve({
  hostname: process.env.HOST ?? "127.0.0.1",
  port: Number(process.env.PORT ?? 3000),
  routes: {
    "/api/*": api,
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
});

console.log(`Backend listening on ${server.url}`);