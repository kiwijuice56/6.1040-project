import type { EndpointValidator } from "@mit-sdg/sync-engine/boundary";
import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { each, former, reaction, whether, when, where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";
import { TOKEN_FUZZY } from "../concepts/Querying/tokenFuzzy.ts";
import { textInput } from "./reusable/inputs.ts";

const { GeographicPosting, Querying, Registering, Upvoting } = concepts;

const searchAroundInput: EndpointValidator = (value) => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { ok: false, detail: "expected a search area" };
  }
  const { location, miles, context } = value as Record<string, unknown>;
  const locationOk =
    typeof location === "object" &&
    location !== null &&
    !Array.isArray(location) &&
    Number.isFinite((location as { latitude?: unknown }).latitude) &&
    Number.isFinite((location as { longitude?: unknown }).longitude);
  const milesOk = typeof miles === "number" && Number.isFinite(miles) && miles > 0 && miles <= 25;
  const contextOk = context === undefined || typeof context === "string";
  return locationOk && milesOk && contextOk
    ? { ok: true }
    : { ok: false, detail: "expected a GPS location and a distance in miles" };
};

const replaceInput: EndpointValidator = (value) => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { ok: false, detail: "expected a search bundle" };
  }
  const { context, members } = value as Record<string, unknown>;
  const membersOk =
    Array.isArray(members) &&
    members.every(
      (row) =>
        typeof row === "object" &&
        row !== null &&
        typeof (row as { resource?: unknown }).resource === "string" &&
        typeof (row as { document?: unknown }).document === "string",
    );
  return typeof context === "string" && membersOk
    ? { ok: true }
    : { ok: false, detail: "expected a context and documents to search" };
};

const rankInput: EndpointValidator = (value) => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { ok: false, detail: "expected a search query" };
  }
  const { context, query, resultCount, algorithm } = value as Record<string, unknown>;
  const countOk =
    resultCount === undefined || (typeof resultCount === "number" && Number.isFinite(resultCount) && resultCount > 0);
  const ok =
    typeof context === "string" &&
    typeof query === "string" &&
    algorithm === TOKEN_FUZZY &&
    countOk;
  return ok ? { ok: true } : { ok: false, detail: "expected a context, query, and tokenFuzzy" };
};

const NearbyDocuments = former(
  "the nearby documents",
  ({ location, miles }, { post, body, author, at }) =>
    each(
      GeographicPosting._postsNear({ location, miles }).is({
        post,
        body,
        author,
        location: at,
      }),
    ).form({ resource: post, document: body }),
);

const RankedNotes = former(
  "the ranked notes",
  ({ context, algorithm, query, resultCount }, { post, body, author, location, username, count, rank }) =>
    each(
      Querying._getNResults({
        context,
        algorithm,
        query,
        resultCount,
      }).is({ resource: post, rank }),
    )
      .arranged(rank, "descending")
      .where(
        GeographicPosting._post({ post }).is({ body, author, location }),
        whether(Registering._username({ user: author }).is({ username })),
        Upvoting._getVoteCount({ resource: post }).is({ count }),
      )
      .form({
        post,
        body,
        author,
        location,
        username,
        count,
      }),
);

const OpenSearch = endpoint(
  "/search/open",
  ({ location, miles, context }) =>
    receive({ location, miles })
      .then(Querying.createContext({}).responds({ context }))
      .then(respond({ context, members: NearbyDocuments({ location, miles }) })),
  { validators: { input: searchAroundInput } },
);

const SyncSearch = endpoint(
  "/search/sync",
  ({ context, location, miles }) =>
    receive({ context, location, miles }).then(
      where(Querying._context({ context }).is({ context })).then(
        respond({ context, members: NearbyDocuments({ location, miles }) }),
      ),
    ),
  { validators: { input: searchAroundInput } },
);

const ReplaceSearch = endpoint(
  "/search/replace",
  ({ context, members }) =>
    receive({ context, members })
      .then(Querying.replace({ context, bundle: members }).responds({ context }))
      .then(respond({ context })),
  { validators: { input: replaceInput } },
);

const RankSearch = endpoint(
  "/search/query",
  ({ context, query, resultCount, algorithm }) =>
    receive({ context, query, resultCount, algorithm }).then(
      respond({ notes: RankedNotes({ context, query, resultCount, algorithm }) }),
    ),
  { validators: { input: rankInput } },
);

const CloseSearch = endpoint(
  "/search/close",
  ({ context }) =>
    receive({ context }).then(Querying.discard({ context }).responds({ context })).then(respond({})),
  { validators: { input: textInput } },
);

const UnindexDeletedNote = reaction(({ post }) =>
  when(GeographicPosting.delete({}).responds({ post })).then(Querying.unindexEverywhere({ resource: post })),
);

const ReindexEditedNote = reaction(({ post, body }) =>
  when(GeographicPosting.edit({ body }).responds({ post })).then(
    Querying.reindexEverywhere({ resource: post, document: body }),
  ),
);

export const searchingHttp = {
  publicErrors: {
    CONTEXT_NOT_FOUND: "NOT_FOUND",
    ALREADY_INDEXED: "CONFLICT",
    NOT_INDEXED: "NOT_FOUND",
    INVALID_BUNDLE: "INVALID_REQUEST",
  },
} as const;

export const composition = {
  opening: { OpenSearch, CloseSearch },
  covering: { SyncSearch, ReplaceSearch, NearbyDocuments },
  ranking: { RankSearch, RankedNotes },
  keeping: { UnindexDeletedNote, ReindexEditedNote },
};
