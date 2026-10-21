import { shallowRef } from "vue";

export type AuthDraft = { username: string; password: string };

const handoff = shallowRef<AuthDraft>();

/** Carries whatever was typed on the log-in page over to the sign-up page. */
export function useAuthDraft() {
  function give(draft: AuthDraft) {
    handoff.value = draft;
  }

  function take(): AuthDraft | undefined {
    const draft = handoff.value;
    handoff.value = undefined;
    return draft;
  }

  return { give, take };
}
