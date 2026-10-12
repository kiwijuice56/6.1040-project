import { createHttpClient } from "@mit-sdg/sync-engine-http/client";
import type { StickyWireHttp } from "../generated/wire.ts";

const client = createHttpClient<StickyWireHttp>({ baseUrl: "http://127.0.0.1:3000/api" });
