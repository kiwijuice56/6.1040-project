import L from "leaflet";
import "leaflet/dist/leaflet.css";

const START = { latitude: 42.3596, longitude: -71.0921 };
const ZOOM = 15;

/** Pan-only OpenStreetMap view. This file is display-only; it does not import concepts. */
export function mountMap(container: HTMLElement) {
  const map = L.map(container, {
    center: [START.latitude, START.longitude],
    zoom: ZOOM,
    minZoom: ZOOM,
    maxZoom: ZOOM,
    zoomControl: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    touchZoom: false,
    boxZoom: false,
    keyboard: false,
    dragging: true,
    attributionControl: true,
  });

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    // The page is no-referrer for Commons callback URLs; OSM's tile CDN refuses those requests.
    referrerPolicy: "origin",
  }).addTo(map);

  const resize = () => map.invalidateSize();
  requestAnimationFrame(resize);
  window.addEventListener("resize", resize);
  return map;
}
