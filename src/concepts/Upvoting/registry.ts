import { registerConcept } from "@mit-sdg/sync-engine/assembly";
import spec from "@design/concepts/Upvoting.md" with { type: "text" };
import type { Db } from "mongodb";
import type { Post } from "../GeographicPosting/GeographicPosting.ts";
import type { User } from "../Registering/Registering.ts";
import { AlreadyVoted, NoVote, UpvotingConcept } from "./Upvoting.ts";

class Upvoting extends UpvotingConcept<User, Post> {}

export const upvoting = registerConcept({
  class: Upvoting,
  spec,
  refusals: {
    ALREADY_VOTED: AlreadyVoted,
    NO_VOTE: NoVote,
  },
  floors: { mongo: ({ database }: { database: Db }, name: string) => new Upvoting(database, name) },
});
