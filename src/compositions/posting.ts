import type { EndpointValidator } from "@mit-sdg/sync-engine/boundary";
import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { each, former, whether } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";
import { textInput } from "./reusable/inputs.ts";

const { Sessioning, GeographicPosting, Registering } = concepts;

const postingInput: EndpointValidator = (value) => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { ok: false, detail: "expected a post" };
  }
  const { session, body, location } = value as Record<string, unknown>;
  const locationOk =
    typeof location === "object" &&
    location !== null &&
    !Array.isArray(location) &&
    Number.isFinite((location as { latitude?: unknown }).latitude) &&
    Number.isFinite((location as { longitude?: unknown }).longitude);
  const ok =
    (typeof session === "string" || session === null) && typeof body === "string" && locationOk;
  return ok ? { ok: true } : { ok: false, detail: "expected a body and a GPS location" };
};

const CreatePost = endpoint(
  "/posts/create",
  ({ session, user, body, location, post }) =>
    receive({ session, body, location })
      .then(Sessioning.use({ session }).responds({ subject: user }))
      .then(GeographicPosting.post({ user, body, location }).responds({ post }))
      .then(respond({ post })),
  { validators: { input: postingInput } },
);

export const postingHttp = {
  publicErrors: {
    EMPTY_BODY: "INVALID_REQUEST",
    INVALID_LOCATION: "INVALID_REQUEST",
  },
} as const;

const AllNotes = former("the public notes", (_input, { post, body, author, location, username }) =>
  each(GeographicPosting._allPosts({}).is({ post, body, author, location }))
    .where(whether(Registering._username({ user: author }).is({ username })))
    .form({
      post,
      body,
      author,
      location,
      username,
    }),
);

const ListPosts = endpoint(
  "/posts/list",
  () => receive({}).then(respond({ posts: AllNotes({}) })),
  { validators: { input: textInput } },
);

export const composition = {
  creating: { CreatePost },
  listing: { ListPosts, AllNotes },
};
