import type { Map } from "leaflet";
import { panToCoordinate } from "./map.ts";

const GPS_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  maximumAge: 15_000,
  timeout: 10_000,
};

let locateGen = 0;

/** One GPS read on load or when consent is granted. A later `cancelLocate` drops an in-flight result. */
export function locateOnce(
  map: Map,
  setHint: (message: string) => void,
  options: { shouldPan?: () => boolean } = {},
) {
  if (!navigator.geolocation) {
    setHint("This browser can't share a location.");
    return;
  }
  const gen = ++locateGen;
  navigator.geolocation.getCurrentPosition(
    (position) => {
      if (gen !== locateGen) return;
      setHint("");
      if (options.shouldPan && !options.shouldPan()) return;
      panToCoordinate(map, {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    },
    () => {
      if (gen !== locateGen) return;
      setHint("Location is blocked in the browser.");
    },
    GPS_OPTIONS,
  );
}

export function cancelLocate() {
  locateGen += 1;
}
