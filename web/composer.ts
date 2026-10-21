import L from "leaflet";
import { createApp, type App } from "vue";
import ComposerCard from "./components/ComposerCard.vue";
import { coordinatesAt, type MapCoordinate } from "./map.ts";
import { accentFor } from "./palette.ts";
import { dismissPopup, placePopup } from "./popup.ts";

export type ComposerOpenOptions = {
  body?: string;
  animate?: boolean;
};

export function mountComposer(
  map: L.Map,
  options: {
    onSubmit: (input: { body: string; location: MapCoordinate }) => Promise<string | undefined>;
    onSignIn: () => void;
    interceptClick?: () => boolean;
    onDismiss?: () => void;
  },
) {
  let marker: L.Marker | undefined;
  let composerApp: App | undefined;
  let draft = "";

  function close(motion: { animate?: boolean; clearDraft?: boolean } = {}) {
    if (motion.clearDraft) draft = "";
    if (!marker) return;
    options.onDismiss?.();
    const app = composerApp;
    const closing = marker;
    composerApp = undefined;
    marker = undefined;
    dismissPopup(closing, motion, () => app?.unmount());
  }

  function currentLocation(): MapCoordinate | undefined {
    if (!marker) return;
    const latlng = marker.getLatLng();
    return { latitude: latlng.lat, longitude: latlng.lng };
  }

  function open(location: MapCoordinate, motion: ComposerOpenOptions = {}) {
    const animate = motion.animate !== false;
    const nextBody = motion.body ?? draft;
    close({ animate });
    draft = nextBody;
    const { marker: next, host } = placePopup(
      map,
      L.latLng(location.latitude, location.longitude),
      { animate },
    );
    marker = next;
    next.getElement()?.style.setProperty("--note-tint", accentFor(location));
    composerApp = createApp(ComposerCard, {
      initialBody: nextBody,
      postNote: async (body: string) => {
        const error = await options.onSubmit({
          body,
          location: currentLocation()!,
        });
        if (!error) close({ clearDraft: true });
        return error;
      },
      onDraft: (body: string) => {
        if (!marker) return;
        draft = body;
      },
      onCancel: () => close(),
      onSignIn: () => options.onSignIn(),
    });
    composerApp.mount(host);
  }

  map.on("click", (event: L.LeafletMouseEvent) => {
    if (options.interceptClick?.()) return;
    open(coordinatesAt(event), { body: draft });
  });

  return {
    open,
    close,
    location: currentLocation,
    isOpen: () => marker !== undefined,
  };
}
