import { registerConcept } from "@mit-sdg/sync-engine/assembly";
import spec from "@design/concepts/Querying.md" with { type: "text" };
import type { Db } from "mongodb";
import type { Post } from "../GeographicPosting/GeographicPosting.ts";
import {
  AlreadyIndexed,
  ContextNotFound,
  InvalidBundle,
  NotIndexed,
  QueryingConcept,
} from "./Querying.ts";

class Querying extends QueryingConcept<Post> {}

export const querying = registerConcept({
  class: Querying,
  spec,
  refusals: {
    CONTEXT_NOT_FOUND: ContextNotFound,
    ALREADY_INDEXED: AlreadyIndexed,
    NOT_INDEXED: NotIndexed,
    INVALID_BUNDLE: InvalidBundle,
  },
  floors: { mongo: ({ database }: { database: Db }, name: string) => new Querying(database, name) },
});
