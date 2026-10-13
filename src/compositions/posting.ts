import type { EndpointValidator } from "@mit-sdg/sync-engine/boundary";
import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { concepts } from "../concepts.ts";

const { Sessioning, GeographicPosting } = concepts;

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

export const composition = {
  creating: { CreatePost },
};
