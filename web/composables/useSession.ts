import { computed, ref } from "vue";
import { api } from "../client.ts";

const viewer = ref<string | undefined>();
const status = ref("");
const busy = ref(false);

/** Session from `/auth/me`. Module-level so map popups (nested Vue apps) share the same viewer. */
export function useSession() {
  const signedIn = computed(() => viewer.value !== undefined);
  const who = computed(() => (viewer.value ? `Signed in as ${viewer.value}` : ""));
  const accountLabel = computed(() => (signedIn.value ? "My profile" : "Sign in"));

  function signedOut(message = "") {
    viewer.value = undefined;
    busy.value = false;
    status.value = message;
  }

  async function loadMe() {
    const result = await api["/auth/me"]();
    if ("error" in result) {
      signedOut();
      return;
    }
    viewer.value = result.username;
    status.value = "";
  }

  async function startCommons() {
    busy.value = true;
    const result = await api["/auth/commons/start"]();
    if ("error" in result) {
      signedOut("Commons sign-in isn't available right now. Try again.");
      return;
    }
    window.location.assign(result.address);
  }

  async function finishCommons(): Promise<{ offer: boolean }> {
    const query = new URLSearchParams(window.location.search);
    window.history.replaceState(null, "", "/");
    if (query.get("error") === "access_denied") {
      signedOut("Sign-in cancelled.");
      return { offer: false };
    }
    const result = await api["/auth/commons/finish"]({
      state: query.get("state") ?? "",
      code: query.get("code") ?? "",
    });
    if (!("error" in result)) {
      await loadMe();
      return { offer: true };
    }
    if (result.error === "CONFLICT") {
      signedOut("Your Commons username is already taken here.");
      return { offer: false };
    }
    if (result.error === "INVALID_REQUEST") {
      signedOut("Your Commons username can't be used here.");
      return { offer: false };
    }
    signedOut(
      result.error === "FORBIDDEN"
        ? "Signing in with Commons didn't work. Start again."
        : "Something went wrong. Try again.",
    );
    return { offer: false };
  }

  /** Returns an error message, or nothing once the session is loaded. */
  async function login(input: { username: string; password: string }): Promise<string | undefined> {
    busy.value = true;
    const result = await api["/auth/login"](input);
    busy.value = false;
    if (!("error" in result)) {
      await loadMe();
      return;
    }
    if (result.error === "UNAUTHORIZED" || result.error === "INVALID_REQUEST") {
      return "The username or password is incorrect.";
    }
    return "Something went wrong. Try again.";
  }

  /** Returns an error message, or nothing once the session is loaded. */
  async function register(input: { username: string; password: string }): Promise<string | undefined> {
    busy.value = true;
    const result = await api["/auth/register"](input);
    busy.value = false;
    if (!("error" in result)) {
      await loadMe();
      return;
    }
    if (result.error === "CONFLICT") return "That username is taken.";
    if (result.error === "INVALID_REQUEST") return "That username or password doesn't follow the rules under each box.";
    return "Something went wrong. Try again.";
  }

  async function logout() {
    busy.value = true;
    await api["/auth/logout"]();
    window.location.assign("/");
  }

  return {
    viewer,
    signedIn,
    who,
    accountLabel,
    status,
    busy,
    loadMe,
    startCommons,
    finishCommons,
    login,
    register,
    logout,
  };
}
