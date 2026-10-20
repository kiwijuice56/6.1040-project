import L, { type Map as LeafletMap } from "leaflet";
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
  getCenter(): MapCoordinate;
  setRadiusMiles(miles: number | null): void;
  openNote(note: PublicNote): void;
  dismissPopups(): void;
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
  onNoteOpen?: () => void;
  consumeMapClick?: () => boolean;
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
    onOpen: () => {
      closeComposer();
      options.onNoteOpen?.();
    },
    onSignIn: () => options.onSignIn(),
    onDismiss: ignoreNextMapClick,
  });
  const composer = mountComposer(map, {
    interceptClick: () => ignoreMapClick || Boolean(options.consumeMapClick?.()) || notes.closeIfOpen(),
    onSignIn: () => options.onSignIn(),
    onSubmit: options.onCreate,
    onDismiss: ignoreNextMapClick,
  });
  closeComposer = () => composer.close();

  const ink = "#2e221a";
  const RADIUS_FADE_MS = 200;
  const RADIUS_LINGER_MS = 1000;
  const RADIUS_FILL = 0.08;
  let radius: L.Circle | undefined;
  let circleOpacity = 0;
  let fadeRaf = 0;
  let hideTimer: number | undefined;
  const followCenter = () => {
    radius?.setLatLng(map.getCenter());
  };

  function circleStyle(t: number): L.PathOptions {
    return { opacity: t, fillOpacity: RADIUS_FILL * t };
  }

  function stopFade() {
    if (fadeRaf) cancelAnimationFrame(fadeRaf);
    fadeRaf = 0;
  }

  function clearHide() {
    if (hideTimer !== undefined) {
      window.clearTimeout(hideTimer);
      hideTimer = undefined;
    }
  }

  function removeCircle() {
    stopFade();
    clearHide();
    map.off("move", followCenter);
    radius?.remove();
    radius = undefined;
    circleOpacity = 0;
  }

  function fadeCircle(target: number, onDone?: () => void) {
    stopFade();
    const from = circleOpacity;
    if (Math.abs(from - target) < 0.02) {
      circleOpacity = target;
      radius?.setStyle(circleStyle(target));
      onDone?.();
      return;
    }
    const started = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - started) / RADIUS_FADE_MS);
      circleOpacity = from + (target - from) * p;
      radius?.setStyle(circleStyle(circleOpacity));
      if (p < 1) {
        fadeRaf = requestAnimationFrame(tick);
        return;
      }
      fadeRaf = 0;
      onDone?.();
    };
    fadeRaf = requestAnimationFrame(tick);
  }

  function setRadiusMiles(miles: number | null) {
    if (miles !== null && miles > 0) {
      clearHide();
      const meters = miles * 1609.344;
      const center = map.getCenter();
      if (!radius) {
        radius = L.circle(center, {
          radius: meters,
          color: ink,
          weight: 2,
          fillColor: ink,
          interactive: false,
          ...circleStyle(0),
        }).addTo(map);
        map.on("move", followCenter);
        circleOpacity = 0;
      } else {
        radius.setRadius(meters);
        radius.setLatLng(center);
      }
      fadeCircle(1);
      return;
    }
    if (!radius) return;
    clearHide();
    hideTimer = window.setTimeout(() => {
      hideTimer = undefined;
      fadeCircle(0, () => {
        if (circleOpacity <= 0.02) removeCircle();
      });
    }, RADIUS_LINGER_MS);
  }

  return {
    onView(view) {
      if (view !== "find") {
        notes.closeIfOpen();
        composer.close();
        removeCircle();
        return;
      }
      map.invalidateSize();
    },
    render(posts) {
      notes.render(posts);
    },
    isEditing: () => notes.isEditing(),
    getCenter() {
      const center = map.getCenter();
      return { latitude: center.lat, longitude: center.lng };
    },
    setRadiusMiles,
    dismissPopups() {
      notes.closeIfOpen();
      composer.close();
    },
    openNote(note) {
      composer.close();
      map.setView([note.location.latitude, note.location.longitude]);
      notes.open(note);
    },
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
      removeCircle();
      if (ignoreMapClickTimer !== undefined) window.clearTimeout(ignoreMapClickTimer);
      notes.closeIfOpen();
      composer.close();
      map.remove();
      if (mapInstance === map) mapInstance = undefined;
    },
  };
}
