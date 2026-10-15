import { api } from "./client.ts";
import { bindPostComposer } from "./composer.ts";
import type { AppView } from "./composables/useView.ts";
import { bindLocation, SHARING_LOCATION } from "./location.ts";
import { mountMap, type MapCoordinate } from "./map.ts";
import { bindNotes } from "./notes.ts";

const PENDING_POST = "sticky.pendingPost";

let started = false;

export type MapUi = {
  setSession(username: string | undefined, options?: { offer?: boolean }): void;
  onView(view: AppView): void;
  stashPendingPost(): void;
  restorePendingPost(): void;
};

/** Leaflet notes/composer/location on a Vue-owned map node. Session and views stay in Vue. */
export function bindMap(options: {
  map: HTMLElement;
  viewer: () => string | undefined;
  onSignIn: () => void;
}): MapUi {
  if (started) {
    throw new Error("bindMap already ran");
  }
  started = true;

  function takePendingPost(): MapCoordinate | undefined {
    const raw = sessionStorage.getItem(PENDING_POST);
    sessionStorage.removeItem(PENDING_POST);
    if (raw === null) return;
    try {
      const value = JSON.parse(raw) as { latitude?: unknown; longitude?: unknown };
      if (typeof value.latitude !== "number" || typeof value.longitude !== "number") return;
      if (!Number.isFinite(value.latitude) || !Number.isFinite(value.longitude)) return;
      return { latitude: value.latitude, longitude: value.longitude };
    } catch {
      return;
    }
  }

  const pending = takePendingPost();
  const map = mountMap(options.map, pending ? { center: pending } : {});
  const locating = bindLocation(map, {
    status: () => api["/location/status"]({ feature: SHARING_LOCATION }),
    consent: () => api["/location/consent"]({ feature: SHARING_LOCATION }),
    withdraw: () => api["/location/withdraw"]({ feature: SHARING_LOCATION }),
  });
  let closeComposer = () => {};
  const notes = bindNotes(map, {
    onOpen: () => closeComposer(),
    viewer: () => options.viewer(),
    onSignIn: () => options.onSignIn(),
    async onMine({ post }) {
      const result = await api["/posts/vote"]({ post });
      if ("error" in result) return;
      if ("upvote" in result && typeof result.upvote === "boolean") return result.upvote ? "up" : "down";
    },
    async onVote({ post, action }) {
      const result =
        action === "upvote"
          ? await api["/posts/upvote"]({ post })
          : action === "downvote"
            ? await api["/posts/downvote"]({ post })
            : await api["/posts/unvote"]({ post });
      if (!("error" in result)) return;
      if (result.error === "UNAUTHORIZED") return "Sign in to vote.";
      if (result.error === "CONFLICT") return "You already have a vote on this.";
      if (result.error === "NOT_FOUND") return "You have not voted on this.";
      return "Something went wrong. Try again.";
    },
    async onEdit({ post, body }) {
      const result = await api["/posts/edit"]({ post, body });
      if (!("error" in result)) return;
      if (result.error === "UNAUTHORIZED") return "Sign in to edit.";
      if (result.error === "FORBIDDEN") return "Only the author can change this post.";
      if (result.error === "NOT_FOUND") return "That note is gone.";
      if (result.error === "INVALID_REQUEST") return "A post needs some text.";
      return "Something went wrong. Try again.";
    },
    async onDelete({ post }) {
      const result = await api["/posts/delete"]({ post });
      if (!("error" in result)) return;
      if (result.error === "UNAUTHORIZED") return "Sign in to delete.";
      if (result.error === "FORBIDDEN") return "Only the author can change this post.";
      if (result.error === "NOT_FOUND") return "That note is gone.";
      return "Something went wrong. Try again.";
    },
  });
  const composer = bindPostComposer(map, {
    interceptClick: () => notes.closeIfOpen(),
    onSignIn: () => options.onSignIn(),
    async onSubmit({ body, location }) {
      const result = await api["/posts/create"]({ body, location });
      if (!("error" in result)) {
        await loadNotes();
        return;
      }
      if (result.error === "UNAUTHORIZED") return "Sign in to post.";
      if (result.error === "INVALID_REQUEST") return "That note couldn't be posted.";
      return "Something went wrong. Try again.";
    },
  });
  closeComposer = () => composer.close();

  const NOTES_POLL_MS = 5_000;
  let loadingNotes = false;

  async function loadNotes() {
    if (loadingNotes) return;
    loadingNotes = true;
    try {
      const result = await api["/posts/list"]();
      if ("error" in result) return;
      notes.render(result.posts);
    } finally {
      loadingNotes = false;
    }
  }

  void loadNotes();
  window.setInterval(() => {
    if (document.hidden || notes.isEditing()) return;
    void loadNotes();
  }, NOTES_POLL_MS);

  return {
    setSession(username, extras = {}) {
      composer.setSignedIn(Boolean(username));
      if (username) void locating.signedIn(username, extras.offer === true);
      else locating.signedOut();
    },
    onView(view) {
      if (view !== "find") {
        notes.closeIfOpen();
        composer.close();
        return;
      }
      map.invalidateSize();
    },
    stashPendingPost() {
      const location = composer.location();
      if (location) sessionStorage.setItem(PENDING_POST, JSON.stringify(location));
    },
    restorePendingPost() {
      if (pending) composer.open(pending, { animate: false });
    },
  };
}
