import type { StickyWireHttp } from "../generated/wire.ts";

export type PublicNote = StickyWireHttp["/posts/list"]["output"]["posts"][number];
export type VoteChoice = "up" | "down";
