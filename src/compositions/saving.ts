import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { each, former, reaction, whether, when, where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";
import { textInput } from "./reusable/inputs.ts";

const { Sessioning, Registering, GeographicPosting, Upvoting, Labeling } = concepts;

const SavedNotes = former(
  "the saved notes",
  ({ label }, { post, body, author, location, username, count }) =>
    each(Labeling._resources({ label }).is({ resource: post }))
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

const SaveNote = endpoint(
  "/saves/save",
  ({ session, user, post, username, label }) =>
    receive({ session, post })
      .then(Sessioning.use({ session }).responds({ subject: user }))
      .then(
        where(Registering._username({ user }).is({ username }))
          .then(Labeling.ensure({ label: username }).responds({ label }))
          .then(Labeling.applyLabel({ label, resource: post }).responds({ resource: post }))
          .then(respond({ post })),
      ),
  { validators: { input: textInput } },
);

const UnsaveNote = endpoint(
  "/saves/unsave",
  ({ session, user, post, username, label }) =>
    receive({ session, post })
      .then(Sessioning.use({ session }).responds({ subject: user }))
      .then(
        where(Registering._username({ user }).is({ username }))
          .then(Labeling.ensure({ label: username }).responds({ label }))
          .then(Labeling.removeLabel({ label, resource: post }).responds({ resource: post }))
          .then(respond({ post })),
      ),
  { validators: { input: textInput } },
);

const ListSaves = endpoint(
  "/saves/list",
  ({ session, user, username }) =>
    receive({ session })
      .then(Sessioning.use({ session }).responds({ subject: user }))
      .then(
        where(Registering._username({ user }).is({ username })).then(
          respond({ notes: SavedNotes({ label: username }) }),
        ),
      ),
  { validators: { input: textInput } },
);

const SaveOwnNote = reaction(({ post, user, username, label }) =>
  when(GeographicPosting.post({ user }).responds({ post }))
    .where(Registering._username({ user }).is({ username }))
    .then(Labeling.ensure({ label: username }).responds({ label }))
    .then(Labeling.applyLabel({ label, resource: post })),
);

const UnlabelDeletedNote = reaction(({ post }) =>
  when(GeographicPosting.delete({}).responds({ post })).then(Labeling.unlabelEverywhere({ resource: post })),
);

export const savingHttp = {
  publicErrors: {
    LABEL_NOT_FOUND: "NOT_FOUND",
    ALREADY_LABELED: "CONFLICT",
    NOT_LABELED: "NOT_FOUND",
  },
} as const;

export const composition = {
  keeping: { SaveNote, UnsaveNote, SaveOwnNote, UnlabelDeletedNote },
  listing: { ListSaves, SavedNotes },
};
