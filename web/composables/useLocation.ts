import { ref } from "vue";
import { api } from "../client.ts";
import { useSession } from "./useSession.ts";

/** Must match the Feature the location composition accepts. */
const SHARING_LOCATION = "sharingLocation";
const OFFERED_PREFIX = "sticky.locationOffered.";

const consented = ref(false);
const hint = ref("");
const busy = ref(false);
const dialogOpen = ref(false);

function markOffered(name: string) {
  try {
    localStorage.setItem(`${OFFERED_PREFIX}${name}`, "1");
  } catch {
    /* private mode */
  }
}

function wasOffered(name: string) {
  try {
    return localStorage.getItem(`${OFFERED_PREFIX}${name}`) === "1";
  } catch {
    return false;
  }
}

/** Consent from `/location/*`. GPS watch stays next to the map. Shared with nested popup apps via module state. */
export function useLocation() {
  const { viewer } = useSession();

  function signedOut() {
    consented.value = false;
    hint.value = "";
    busy.value = false;
    dialogOpen.value = false;
  }

  async function applySession(offer: boolean) {
    const name = viewer.value;
    if (!name) {
      signedOut();
      return;
    }
    hint.value = "";
    const result = await api["/location/status"]({ feature: SHARING_LOCATION });
    if ("error" in result) {
      consented.value = false;
      return;
    }
    consented.value = result.consented;
    if (!result.consented && offer && !wasOffered(name)) dialogOpen.value = true;
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
    if (ok && viewer.value) markOffered(viewer.value);
    busy.value = false;
  }

  function skipOffer() {
    if (viewer.value) markOffered(viewer.value);
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
    applySession,
    signedOut,
    acceptOffer,
    skipOffer,
    onToggle,
  };
}
