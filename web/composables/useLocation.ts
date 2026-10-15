import { computed, ref } from "vue";
import { api } from "../client.ts";
import { markLocationOffered, SHARING_LOCATION, wasLocationOffered } from "../location.ts";
import { useSession } from "./useSession.ts";

const consented = ref(false);
const hint = ref("");
const busy = ref(false);
const dialogOpen = ref(false);

/** Consent from `/location/*`. GPS watch stays next to the map. */
export function useLocation() {
  const { viewer, signedIn } = useSession();
  const showToggle = computed(() => signedIn.value);

  function signedOut() {
    consented.value = false;
    hint.value = "";
    busy.value = false;
    dialogOpen.value = false;
  }

  async function applySession(name: string, offer: boolean) {
    hint.value = "";
    const result = await api["/location/status"]({ feature: SHARING_LOCATION });
    if ("error" in result) {
      consented.value = false;
      return;
    }
    consented.value = result.consented;
    if (!result.consented && offer && !wasLocationOffered(name)) dialogOpen.value = true;
  }

  async function grant() {
    const result = await api["/location/consent"]({ feature: SHARING_LOCATION });
    if ("error" in result && result.error && result.error !== "CONFLICT") {
      consented.value = false;
      hint.value = "Couldn't save that choice. Try again.";
      return false;
    }
    consented.value = true;
    hint.value = "";
    return true;
  }

  async function revoke() {
    const result = await api["/location/withdraw"]({ feature: SHARING_LOCATION });
    if ("error" in result && result.error && result.error !== "CONFLICT") {
      consented.value = true;
      hint.value = "Couldn't save that choice. Try again.";
      return false;
    }
    consented.value = false;
    hint.value = "";
    return true;
  }

  async function acceptOffer() {
    if (busy.value) return;
    busy.value = true;
    dialogOpen.value = false;
    const ok = await grant();
    if (ok && viewer.value) markLocationOffered(viewer.value);
    busy.value = false;
  }

  function skipOffer() {
    if (viewer.value) markLocationOffered(viewer.value);
    dialogOpen.value = false;
  }

  async function onToggle(next: boolean) {
    if (busy.value) return;
    busy.value = true;
    await (next ? grant() : revoke());
    busy.value = false;
  }

  return {
    consented,
    hint,
    busy,
    dialogOpen,
    showToggle,
    applySession,
    signedOut,
    acceptOffer,
    skipOffer,
    onToggle,
  };
}
