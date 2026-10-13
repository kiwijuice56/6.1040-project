import { createHttpClient } from "@mit-sdg/sync-engine-http/client";
import type { StickyWireHttp } from "../generated/wire.ts";
import { bindPostComposer } from "./composer.ts";
import { mountMap, type MapCoordinate } from "./map.ts";

const PENDING_POST = "sticky.pendingPost";

const api = createHttpClient<StickyWireHttp>({ baseUrl: "/api" });

const who = document.querySelector<HTMLParagraphElement>("#who")!;
const status = document.querySelector<HTMLParagraphElement>("#status")!;
const signIn = document.querySelector<HTMLButtonElement>("#signin")!;
const signOut = document.querySelector<HTMLButtonElement>("#signout")!;

function signedOut(message = "") {
  who.hidden = true;
  who.textContent = "";
  signOut.hidden = true;
  signIn.hidden = false;
  signIn.disabled = false;
  status.textContent = message;
  composer.setSignedIn(false);
}

function signedIn(username: string) {
  who.hidden = false;
  who.textContent = `Signed in as ${username}`;
  signIn.hidden = true;
  signOut.hidden = false;
  status.textContent = "";
  composer.setSignedIn(true);
}

async function loadMe() {
  const result = await api["/auth/me"]();
  if ("error" in result) signedOut();
  else signedIn(result.username);
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
    await loadMe();
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
const composer = bindPostComposer(map, {
  onSignIn: () => {
    void startCommons();
  },
  async onSubmit({ body, location }) {
    const result = await api["/posts/create"]({ body, location });
    if (!("error" in result)) return;
    if (result.error === "UNAUTHORIZED") return "Sign in to post.";
    if (result.error === "INVALID_REQUEST") return "That note couldn't be posted.";
    return "Something went wrong. Try again.";
  },
});

if (window.location.pathname === "/auth/commons/callback") {
  status.textContent = "Signing in with Commons…";
  signIn.hidden = true;
  void finishCommons().finally(restorePendingPost);
} else {
  void loadMe().finally(restorePendingPost);
}
