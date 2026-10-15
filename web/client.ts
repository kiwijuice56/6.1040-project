import { createHttpClient } from "@mit-sdg/sync-engine-http/client";
import type { StickyWireHttp } from "../generated/wire.ts";

export const api = createHttpClient<StickyWireHttp>({ baseUrl: "/api" });
