import { createHttpClient } from "@mit-sdg/sync-engine-http/client";
import type { StickyWireHttp } from "../generated/wire.ts";
import { mountMap } from "./map.ts";

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
}

function signedIn(username: string) {
  who.hidden = false;
  who.textContent = `Signed in as ${username}`;
  signIn.hidden = true;
  signOut.hidden = false;
  status.textContent = "";
}

async function loadMe() {
  const result = await api["/auth/me"]();
  if ("error" in result) signedOut();
  else signedIn(result.username);
}

async function startCommons() {
  signIn.disabled = true;
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

signIn.addEventListener("click", () => {
  void startCommons();
});

signOut.addEventListener("click", async () => {
  signOut.disabled = true;
  await api["/auth/logout"]();
  window.location.assign("/");
});

mountMap(document.querySelector("#map")!);

if (window.location.pathname === "/auth/commons/callback") {
  status.textContent = "Signing in with Commons…";
  signIn.hidden = true;
  void finishCommons();
} else {
  void loadMe();
}
