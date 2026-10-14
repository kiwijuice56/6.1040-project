import L from "leaflet";
import "leaflet/dist/leaflet.css";

const START = { latitude: 42.3596, longitude: -71.0921 };
const ZOOM = 15;
const MIN_ZOOM = 3;
const MAX_ZOOM = 18;

export type MapCoordinate = { latitude: number; longitude: number };

/** GPS of a map click. Leaflet only fires `click` when the pointer did not drag. */
export function coordinatesAt(event: { latlng: L.LatLng }): MapCoordinate {
  return { latitude: event.latlng.lat, longitude: event.latlng.lng };
}

async function cartoApiKey(): Promise<string> {
  const res = await fetch("/carto-key");
  if (!res.ok) return "";
  const body = (await res.json()) as { key?: unknown };
  return typeof body.key === "string" ? body.key : "";
}

/** CARTO Voyager view with button and mouse-wheel zoom. This file is display-only; it does not import concepts. */
export function mountMap(container: HTMLElement, options: { center?: MapCoordinate } = {}) {
  const start = options.center ?? START;
  const map = L.map(container, {
    center: [start.latitude, start.longitude],
    zoom: ZOOM,
    minZoom: MIN_ZOOM,
    maxZoom: MAX_ZOOM,
    zoomControl: false,
    scrollWheelZoom: true,
    doubleClickZoom: false,
    touchZoom: false,
    boxZoom: false,
    keyboard: false,
    dragging: true,
    attributionControl: true,
  });
  L.control.zoom({ position: "topleft" }).addTo(map);

  void cartoApiKey().then((cartoKey) => {
    L.tileLayer(
      `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${encodeURIComponent(cartoKey)}`,
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attribution/">CARTO</a>',
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        // The page is no-referrer for Commons callback URLs; some tile CDNs refuse those requests.
        referrerPolicy: "origin",
      },
    ).addTo(map);
  });

  const resize = () => map.invalidateSize();
  requestAnimationFrame(resize);
  window.addEventListener("resize", resize);
  return map;
}

/** Move the map to a GPS point without changing zoom. */
export function panToCoordinate(map: L.Map, coord: MapCoordinate) {
  map.panTo([coord.latitude, coord.longitude]);
}
