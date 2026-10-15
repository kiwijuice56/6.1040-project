import L from "leaflet";

export const POPUP_SIZE = 260;
/** Screen-pixel gap between the pin and the popup. Leaflet icons are in pixels, so this stays constant across zoom. */
export const RADIUS = 20;
export const PAN_SECONDS = 0.25;
export const SCALE_MS = 100;

export function panClickToWindowCenter(map: L.Map, latlng: L.LatLng, animate: boolean) {
  const mapRect = map.getContainer().getBoundingClientRect();
  const size = map.getSize();
  const windowCenterInMap = L.point(size.x / 2, window.innerHeight / 2 - mapRect.top);
  const clickInMap = map.latLngToContainerPoint(latlng);
  map.panBy(clickInMap.subtract(windowCenterInMap), { animate, duration: PAN_SECONDS });
}

/** Leaflet pin plus an empty host. Mount a Vue app on `host` after this returns. */
export function placePopup(map: L.Map, latlng: L.LatLng, options: { animate?: boolean } = {}) {
  const animate = options.animate !== false;
  const marker = L.marker(latlng, {
    icon: L.divIcon({
      className: "post-composer",
      iconSize: [POPUP_SIZE + RADIUS, POPUP_SIZE],
      iconAnchor: [0, POPUP_SIZE / 2],
      html: `<div class="post-composer-body"><div class="popup-mount"></div></div>`,
    }),
    interactive: true,
    keyboard: false,
    zIndexOffset: 1000,
  }).addTo(map);
  const el = marker.getElement();
  const host = el?.querySelector<HTMLElement>(".popup-mount");
  if (!el || !host) {
    marker.remove();
    throw new Error("Leaflet did not create a popup host.");
  }
  L.DomEvent.disableClickPropagation(el);
  L.DomEvent.disableScrollPropagation(el);
  L.DomEvent.on(el, "mouseup", L.DomEvent.stopPropagation);
  L.DomEvent.on(el, "pointerup", L.DomEvent.stopPropagation);
  if (animate) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => el.classList.add("is-open"));
    });
  } else {
    el.classList.add("is-open", "post-composer-instant");
  }
  panClickToWindowCenter(map, latlng, animate);
  return { marker, host };
}

export function dismissPopup(
  marker: L.Marker | undefined,
  options: { animate?: boolean } = {},
  after?: () => void,
) {
  if (!marker) {
    after?.();
    return;
  }
  const animate = options.animate !== false;
  const el = marker.getElement();
  const finish = () => {
    after?.();
    marker.remove();
  };
  if (!animate || !el) {
    finish();
    return;
  }
  el.classList.remove("is-open");
  window.setTimeout(finish, SCALE_MS);
}
