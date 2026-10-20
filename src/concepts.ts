import { conceptSet } from "@mit-sdg/sync-engine/assembly";
import { consenting } from "./concepts/Consenting/registry.ts";
import { commonsFederating } from "./concepts/Federating/registry.ts";
import { geographicPosting } from "./concepts/GeographicPosting/registry.ts";
import { labeling } from "./concepts/Labeling/registry.ts";
import { querying } from "./concepts/Querying/registry.ts";
import { registering } from "./concepts/Registering/registry.ts";
import { sessioning } from "./concepts/Sessioning/registry.ts";
import { upvoting } from "./concepts/Upvoting/registry.ts";

export const applicationConceptSet = conceptSet({
  Registering: registering,
  CommonsFederating: commonsFederating,
  Sessioning: sessioning,
  Consenting: consenting,
  GeographicPosting: geographicPosting,
  Upvoting: upvoting,
  Querying: querying,
  Labeling: labeling,
});


export const { concepts } = applicationConceptSet;