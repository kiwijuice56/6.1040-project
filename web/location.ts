import type { Map } from "leaflet";
import { panToCoordinate } from "./map.ts";

/** Must match the Feature the location composition accepts. */
export const SHARING_LOCATION = "sharingLocation";

const OFFERED_PREFIX = "sticky.locationOffered.";

export function markLocationOffered(name: string) {
  try {
    localStorage.setItem(`${OFFERED_PREFIX}${name}`, "1");
  } catch {
    /* private mode */
  }
}

export function wasLocationOffered(name: string) {
  try {
    return localStorage.getItem(`${OFFERED_PREFIX}${name}`) === "1";
  } catch {
    return false;
  }
}

export function startGpsWatch(map: Map, setHint: (message: string) => void) {
  if (!navigator.geolocation) {
    setHint("This browser can't share a location.");
    return undefined;
  }
  return navigator.geolocation.watchPosition(
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

export function stopGpsWatch(watch: number | undefined) {
  if (watch === undefined) return;
  navigator.geolocation.clearWatch(watch);
}
