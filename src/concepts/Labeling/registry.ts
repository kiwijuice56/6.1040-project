import { registerConcept } from "@mit-sdg/sync-engine/assembly";
import spec from "@design/concepts/Labeling.md" with { type: "text" };
import type { Db } from "mongodb";
import type { Post } from "../GeographicPosting/GeographicPosting.ts";
import { AlreadyLabeled, LabelingConcept, LabelNotFound, NotLabeled } from "./Labeling.ts";

class Labeling extends LabelingConcept<Post> {}

export const labeling = registerConcept({
  class: Labeling,
  spec,
  refusals: {
    LABEL_NOT_FOUND: LabelNotFound,
    ALREADY_LABELED: AlreadyLabeled,
    NOT_LABELED: NotLabeled,
  },
  floors: { mongo: ({ database }: { database: Db }, name: string) => new Labeling(database, name) },
});
