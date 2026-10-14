import { httpWire } from "@mit-sdg/sync-engine-http/tooling";
import { MongoClient } from "mongodb";
import { assembleApplication } from "./src/assembly.ts";
import { MemoryProvider } from "./src/concepts/Federating/provider.ts";
import { stickyPolicy } from "./src/http.ts";

// `sync-engine check` reads only the assembly's shape and calls no concept, so this client never connects.
const database = new MongoClient("mongodb://localhost").db("sticky");

export default {
  assemble: () => assembleApplication({ database, commons: new MemoryProvider() }),
  title: "Sticky",
  wireName: "StickyWire",
  design: {
    version: 1,
    documents: [
      new URL("./design/types.md", import.meta.url),
      new URL("./design/compositions/reusable/accounts.md", import.meta.url),
      new URL("./design/compositions/reusable/commons.md", import.meta.url),
      new URL("./design/compositions/posting.md", import.meta.url),
      new URL("./design/compositions/location.md", import.meta.url),
    ],
  },
  projections: [httpWire({ policy: stickyPolicy("http://localhost:3000"), name: "StickyWireHttp" })],
};