import { registerConcept } from "@mit-sdg/sync-engine/assembly";
import spec from "@design/concepts/GeographicPosting.md" with { type: "text" };
import type { Db } from "mongodb";
import type { User } from "../Registering/Registering.ts";
import {
  EmptyBody,
  GeographicPostingConcept,
  InvalidLocation,
  NotAuthor,
  PostNotFound,
} from "./GeographicPosting.ts";

class GeographicPosting extends GeographicPostingConcept<User> {}

export const geographicPosting = registerConcept({
  class: GeographicPosting,
  spec,
  refusals: {
    EMPTY_BODY: EmptyBody,
    INVALID_LOCATION: InvalidLocation,
    POST_NOT_FOUND: PostNotFound,
    NOT_AUTHOR: NotAuthor,
  },
  floors: { mongo: ({ database }: { database: Db }, name: string) => new GeographicPosting(database, name) },
});
