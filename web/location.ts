import type { Map } from "leaflet";
import { panToCoordinate } from "./map.ts";

/** Must match the Feature the location composition accepts. */
export const SHARING_LOCATION = "sharingLocation";

const OFFERED_PREFIX = "sticky.locationOffered.";

export function bindLocation(
  map: Map,
  options: {
    status: () => Promise<{ consented: boolean } | { error: string }>;
    consent: () => Promise<{ error?: string }>;
    withdraw: () => Promise<{ error?: string }>;
  },
) {
  const toggle = document.querySelector<HTMLLabelElement>("#location-toggle")!;
  const checkbox = document.querySelector<HTMLInputElement>("#use-location")!;
  const hint = document.querySelector<HTMLParagraphElement>("#location-status")!;
  const dialog = document.querySelector<HTMLElement>("#location-consent")!;
  const accept = document.querySelector<HTMLButtonElement>("#location-accept")!;
  const skip = document.querySelector<HTMLButtonElement>("#location-skip")!;
  let watch: number | undefined;
  let username: string | undefined;
  let busy = false;

  function setHint(message = "") {
    hint.hidden = message === "";
    hint.textContent = message;
  }

  function offeredKey(name: string) {
    return `${OFFERED_PREFIX}${name}`;
  }

  function markOffered(name: string) {
    try {
      localStorage.setItem(offeredKey(name), "1");
    } catch {
      /* private mode */
    }
  }

  function wasOffered(name: string) {
    try {
      return localStorage.getItem(offeredKey(name)) === "1";
    } catch {
      return false;
    }
  }

  function stopWatch() {
    if (watch === undefined) return;
    navigator.geolocation.clearWatch(watch);
    watch = undefined;
  }

  function startWatch() {
    if (watch !== undefined) return;
    if (!navigator.geolocation) {
      setHint("This browser can't share a location.");
      return;
    }
    watch = navigator.geolocation.watchPosition(
      (position) => {
        setHint("");
        panToCoordinate(map, {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        setHint("Location is blocked in the browser.");
      },
      { enableHighAccuracy: false, maximumAge: 15_000, timeout: 10_000 },
    );
  }

  function hideDialog() {
    dialog.hidden = true;
  }

  function showDialog() {
    dialog.hidden = false;
    accept.focus();
  }

  async function grant() {
    const result = await options.consent();
    if ("error" in result && result.error && result.error !== "CONFLICT") {
      checkbox.checked = false;
      setHint("Couldn't save that choice. Try again.");
      return false;
    }
    checkbox.checked = true;
    startWatch();
    return true;
  }

  async function revoke() {
    stopWatch();
    const result = await options.withdraw();
    if ("error" in result && result.error && result.error !== "CONFLICT") {
      checkbox.checked = true;
      startWatch();
      setHint("Couldn't save that choice. Try again.");
      return false;
    }
    checkbox.checked = false;
    setHint("");
    return true;
  }

  accept.addEventListener("click", () => {
    if (busy) return;
    busy = true;
    accept.disabled = true;
    skip.disabled = true;
    hideDialog();
    void grant()
      .then((ok) => {
        if (ok && username) markOffered(username);
      })
      .finally(() => {
        accept.disabled = false;
        skip.disabled = false;
        busy = false;
      });
  });

  skip.addEventListener("click", () => {
    if (username) markOffered(username);
    hideDialog();
  });

  dialog.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || dialog.hidden) return;
    if (username) markOffered(username);
    hideDialog();
  });

  checkbox.addEventListener("change", () => {
    if (busy) {
      checkbox.checked = !checkbox.checked;
      return;
    }
    busy = true;
    checkbox.disabled = true;
    const next = checkbox.checked;
    void (next ? grant() : revoke()).finally(() => {
      checkbox.disabled = false;
      busy = false;
    });
  });

  return {
    async signedIn(name: string, offer: boolean) {
      username = name;
      toggle.hidden = false;
      checkbox.disabled = true;
      setHint("");
      const result = await options.status();
      if ("error" in result) {
        checkbox.checked = false;
        checkbox.disabled = false;
        return;
      }
      if (result.consented) {
        checkbox.checked = true;
        startWatch();
      } else {
        checkbox.checked = false;
        stopWatch();
        if (offer && !wasOffered(name)) showDialog();
      }
      checkbox.disabled = false;
    },
    signedOut() {
      username = undefined;
      stopWatch();
      hideDialog();
      toggle.hidden = true;
      checkbox.checked = false;
      checkbox.disabled = false;
      setHint("");
    },
  };
}
