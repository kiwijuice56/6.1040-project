import type { Map as LeafletMap } from "leaflet";
import { mountComposer } from "./composer.ts";
import type { AppView } from "./composables/useView.ts";
import { cancelLocate, locateOnce } from "./location.ts";
import { mountMap, type MapCoordinate } from "./map.ts";
import { mountNotes } from "./notes.ts";
import type { PublicNote } from "./types.ts";

const PENDING_POST = "sticky.pendingPost";
/** Long enough to swallow the map click that fires after the overlay is removed. */
const IGNORE_MAP_CLICK_MS = 300;

let mapInstance: LeafletMap | undefined;

export type MapUi = {
  onView(view: AppView): void;
  render(posts: readonly PublicNote[]): void;
  isEditing(): boolean;
  startGps(setHint: (message: string) => void): void;
  stopGps(): void;
  stashPendingPost(): void;
  restorePendingPost(): void;
  destroy(): void;
};

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

/** Leaflet island. Session, posts, and location consent stay in Vue. */
export function mountMapUi(options: {
  map: HTMLElement;
  onSignIn: () => void;
  onCreate: (input: { body: string; location: PublicNote["location"] }) => Promise<string | undefined>;
}): MapUi {
  mapInstance?.remove();
  mapInstance = undefined;

  const pending = takePendingPost();
  const map = mountMap(options.map, pending ? { center: pending } : {});
  mapInstance = map;

  let ignoreMapClick = false;
  let ignoreMapClickTimer: number | undefined;
  function ignoreNextMapClick() {
    ignoreMapClick = true;
    if (ignoreMapClickTimer !== undefined) window.clearTimeout(ignoreMapClickTimer);
    ignoreMapClickTimer = window.setTimeout(() => {
      ignoreMapClick = false;
      ignoreMapClickTimer = undefined;
    }, IGNORE_MAP_CLICK_MS);
  }

  let closeComposer = () => {};
  const notes = mountNotes(map, {
    onOpen: () => closeComposer(),
    onSignIn: () => options.onSignIn(),
    onDismiss: ignoreNextMapClick,
  });
  const composer = mountComposer(map, {
    interceptClick: () => ignoreMapClick || notes.closeIfOpen(),
    onSignIn: () => options.onSignIn(),
    onSubmit: options.onCreate,
    onDismiss: ignoreNextMapClick,
  });
  closeComposer = () => composer.close();

  return {
    onView(view) {
      if (view !== "find") {
        notes.closeIfOpen();
        composer.close();
        return;
      }
      map.invalidateSize();
    },
    render(posts) {
      notes.render(posts);
    },
    isEditing: () => notes.isEditing(),
    startGps(setHint) {
      locateOnce(map, setHint, {
        shouldPan: () => !notes.isOpen() && !composer.isOpen(),
      });
    },
    stopGps: cancelLocate,
    stashPendingPost() {
      const location = composer.location();
      if (location) sessionStorage.setItem(PENDING_POST, JSON.stringify(location));
    },
    restorePendingPost() {
      if (pending) composer.open(pending, { animate: false });
    },
    destroy() {
      cancelLocate();
      if (ignoreMapClickTimer !== undefined) window.clearTimeout(ignoreMapClickTimer);
      notes.closeIfOpen();
      composer.close();
      map.remove();
      if (mapInstance === map) mapInstance = undefined;
    },
  };
}
