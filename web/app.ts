import { createHttpClient } from "@mit-sdg/sync-engine-http/client";
import type { StickyWireHttp } from "../generated/wire.ts";
import { bindPostComposer } from "./composer.ts";
import { bindLocation, SHARING_LOCATION } from "./location.ts";
import { mountMap, type MapCoordinate } from "./map.ts";
import { bindNav } from "./nav.ts";
import { bindNotes } from "./notes.ts";

const PENDING_POST = "sticky.pendingPost";

const api = createHttpClient<StickyWireHttp>({ baseUrl: "/api" });

const who = document.querySelector<HTMLParagraphElement>("#who")!;
const status = document.querySelector<HTMLParagraphElement>("#status")!;
const signIn = document.querySelector<HTMLButtonElement>("#signin")!;
const signOut = document.querySelector<HTMLButtonElement>("#signout")!;

let viewer: string | undefined;

function setStatus(message = "") {
  status.textContent = message;
  status.hidden = message === "";
}

function signedOut(message = "") {
  who.hidden = true;
  who.textContent = "";
  signOut.hidden = true;
  signIn.hidden = false;
  signIn.disabled = false;
  setStatus(message);
  viewer = undefined;
  composer.setSignedIn(false);
  nav.setSignedIn(false);
  locating.signedOut();
}

function signedIn(username: string, offer = false) {
  who.hidden = false;
  who.textContent = `Signed in as ${username}`;
  signIn.hidden = true;
  signOut.hidden = false;
  setStatus("");
  viewer = username;
  composer.setSignedIn(true);
  nav.setSignedIn(true);
  void locating.signedIn(username, offer);
}

async function loadMe(offer = false) {
  const result = await api["/auth/me"]();
  if ("error" in result) signedOut();
  else signedIn(result.username, offer);
}

async function startCommons() {
  stashPendingPost();
  signIn.disabled = true;
  const popupSignIn = document.querySelector<HTMLButtonElement>(".post-composer-signin");
  if (popupSignIn) popupSignIn.disabled = true;
  const result = await api["/auth/commons/start"]();
  if ("error" in result) {
    signedOut("Commons sign-in isn't available right now. Try again.");
    return;
  }
  window.location.assign(result.address);
}

async function finishCommons() {
  const query = new URLSearchParams(window.location.search);
  window.history.replaceState(null, "", "/");
  if (query.get("error") === "access_denied") {
    signedOut("Sign-in cancelled.");
    return;
  }
  const result = await api["/auth/commons/finish"]({
    state: query.get("state") ?? "",
    code: query.get("code") ?? "",
  });
  if (!("error" in result)) {
    await loadMe(true);
    return;
  }
  if (result.error === "CONFLICT") {
    signedOut("Your Commons username is already taken here.");
    return;
  }
  if (result.error === "INVALID_REQUEST") {
    signedOut("Your Commons username can't be used here.");
    return;
  }
  signedOut(
    result.error === "FORBIDDEN"
      ? "Signing in with Commons didn't work. Start again."
      : "Something went wrong. Try again.",
  );
}

function stashPendingPost() {
  const location = composer.location();
  if (location) sessionStorage.setItem(PENDING_POST, JSON.stringify(location));
}

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

function restorePendingPost() {
  if (pending) composer.open(pending, { animate: false });
}

signIn.addEventListener("click", () => {
  void startCommons();
});

signOut.addEventListener("click", async () => {
  signOut.disabled = true;
  await api["/auth/logout"]();
  window.location.assign("/");
});

const pending = takePendingPost();
const map = mountMap(document.querySelector("#map")!, pending ? { center: pending } : {});
const locating = bindLocation(map, {
  status: () => api["/location/status"]({ feature: SHARING_LOCATION }),
  consent: () => api["/location/consent"]({ feature: SHARING_LOCATION }),
  withdraw: () => api["/location/withdraw"]({ feature: SHARING_LOCATION }),
});
let closeComposer = () => {};
const notes = bindNotes(map, {
  onOpen: () => closeComposer(),
  viewer: () => viewer,
  onSignIn: () => {
    void startCommons();
  },
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
  onSignIn: () => {
    void startCommons();
  },
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
const nav = bindNav({
  onSignIn: () => {
    void startCommons();
  },
  onView(view) {
    if (view !== "find") {
      notes.closeIfOpen();
      composer.close();
      return;
    }
    map.invalidateSize();
  },
});

if (window.location.pathname === "/auth/commons/callback") {
  setStatus("Signing in with Commons…");
  signIn.hidden = true;
  void finishCommons().finally(restorePendingPost);
} else {
  void loadMe().finally(restorePendingPost);
}
