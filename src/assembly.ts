import { assemble } from "@mit-sdg/sync-engine/assembly";
import { applicationConceptSet } from "./concepts.ts";

import { composition as commons } from "./compositions/reusable/commons.ts";
import { composition as accounts } from "./compositions/reusable/accounts.ts";
import { composition as posting } from "./compositions/posting.ts";
import { composition as location } from "./compositions/location.ts";
import { composition as searching } from "./compositions/searching.ts";

import type { Db } from "mongodb";
import type { Provider } from "./concepts/Federating/provider.ts";

export function assembleApplication(
  resources: { database: Db; commons: Provider }
) {
  return assemble({
    conceptSet: applicationConceptSet,
    instances: applicationConceptSet.implementations("mongo", resources),
    composition: {
      reusable: { accounts, commons },
      posting,
      location,
      searching,
    },
    redaction: { fields: ["attempt", "nonce", "state", "code"] },
    // Print what went wrong. Otherwise a failure only shows up as INTERNAL_ERROR.
    rawFaultReporter: ({ error }) => console.error(error),
  });
}