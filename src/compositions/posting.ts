import type { EndpointValidator } from "@mit-sdg/sync-engine/boundary";
import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { each, former, no, whether, where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";
import { textInput } from "./reusable/inputs.ts";

const { Sessioning, GeographicPosting, Registering, Upvoting } = concepts;

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

const EditPost = endpoint(
  "/posts/edit",
  ({ session, user, post, body }) =>
    receive({ session, post, body })
      .then(Sessioning.use({ session }).responds({ subject: user }))
      .then(GeographicPosting.edit({ user, post, body }).responds({ post }))
      .then(respond({ post })),
  { validators: { input: textInput } },
);

const DeletePost = endpoint(
  "/posts/delete",
  ({ session, user, post }) =>
    receive({ session, post })
      .then(Sessioning.use({ session }).responds({ subject: user }))
      .then(GeographicPosting.delete({ user, post }).responds({ post }))
      .then(Upvoting.clearAllVotes({ resource: post }).responds({ resource: post }))
      .then(respond({ post })),
  { validators: { input: textInput } },
);

const UpvotePost = endpoint(
  "/posts/upvote",
  ({ session, user, post }) =>
    receive({ session, post })
      .then(Sessioning.use({ session }).responds({ subject: user }))
      .then(Upvoting.upvote({ voter: user, resource: post }).responds({ resource: post }))
      .then(respond({ post })),
  { validators: { input: textInput } },
);

const DownvotePost = endpoint(
  "/posts/downvote",
  ({ session, user, post }) =>
    receive({ session, post })
      .then(Sessioning.use({ session }).responds({ subject: user }))
      .then(Upvoting.downvote({ voter: user, resource: post }).responds({ resource: post }))
      .then(respond({ post })),
  { validators: { input: textInput } },
);

const UnvotePost = endpoint(
  "/posts/unvote",
  ({ session, user, post }) =>
    receive({ session, post })
      .then(Sessioning.use({ session }).responds({ subject: user }))
      .then(Upvoting.unvote({ voter: user, resource: post }).responds({ resource: post }))
      .then(respond({ post })),
  { validators: { input: textInput } },
);

const ReadVote = endpoint(
  "/posts/vote",
  ({ session, user, post, upvote }) =>
    receive({ session, post })
      .then(Sessioning.use({ session }).responds({ subject: user }))
      .then(
        where(Upvoting._getVote({ voter: user, resource: post }).is({ upvote }))
          .then(respond({ upvote }))
          .named("voted"),
        where(no(Upvoting._getVote({ voter: user, resource: post })))
          .then(respond({}))
          .named("none"),
      ),
  { validators: { input: textInput } },
);

export const postingHttp = {
  publicErrors: {
    EMPTY_BODY: "INVALID_REQUEST",
    INVALID_LOCATION: "INVALID_REQUEST",
    POST_NOT_FOUND: "NOT_FOUND",
    NOT_AUTHOR: "FORBIDDEN",
    ALREADY_VOTED: "CONFLICT",
    NO_VOTE: "NOT_FOUND",
  },
} as const;

const AllNotes = former("the public notes", (_input, { post, body, author, location, username, count }) =>
  each(GeographicPosting._allPosts({}).is({ post, body, author, location }))
    .where(
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

const ListPosts = endpoint(
  "/posts/list",
  () => receive({}).then(respond({ posts: AllNotes({}) })),
  { validators: { input: textInput } },
);

export const composition = {
  creating: { CreatePost },
  listing: { ListPosts, AllNotes },
  changing: { EditPost, DeletePost },
  ranking: { UpvotePost, DownvotePost, UnvotePost, ReadVote },
};
