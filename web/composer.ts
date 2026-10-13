import L from "leaflet";
import { coordinatesAt, type MapCoordinate } from "./map.ts";

const POPUP_SIZE = 260;
/** Screen-pixel gap between the click and the popup. Leaflet icons are in pixels, so this stays constant across zoom. */
const RADIUS = 20;
const PAN_SECONDS = 0.25;
const SCALE_MS = 100;

export type ComposerOpenOptions = {
  body?: string;
  animate?: boolean;
};

export function bindPostComposer(
  map: L.Map,
  options: {
    onSubmit: (input: { body: string; location: MapCoordinate }) => Promise<string | undefined>;
    onSignIn: () => void;
  },
) {
  let marker: L.Marker | undefined;
  let form: HTMLFormElement | undefined;
  let signedIn = false;

  function close(motion: { animate?: boolean } = {}) {
    const toRemove = marker;
    marker = undefined;
    form = undefined;
    if (!toRemove) return;
    const animate = motion.animate !== false;
    const el = toRemove.getElement();
    if (!animate || !el) {
      toRemove.remove();
      return;
    }
    el.classList.remove("is-open");
    window.setTimeout(() => toRemove.remove(), SCALE_MS);
  }

  function currentBody() {
    return form?.querySelector("textarea")?.value ?? "";
  }

  function currentLocation(): MapCoordinate | undefined {
    if (!marker) return;
    const latlng = marker.getLatLng();
    return { latitude: latlng.lat, longitude: latlng.lng };
  }

  function setError(message: string) {
    const error = form?.querySelector<HTMLParagraphElement>(".post-composer-error");
    if (error) error.textContent = message;
  }

  function open(location: MapCoordinate, motion: ComposerOpenOptions = {}) {
    const animate = motion.animate !== false;
    close({ animate });
    const latlng = L.latLng(location.latitude, location.longitude);
    form = buildForm({
      signedIn,
      body: signedIn ? (motion.body ?? "") : "",
      onSubmit: async (nextBody) => {
        setError("");
        const submit = form?.querySelector<HTMLButtonElement>("button[type='submit']");
        if (submit) submit.disabled = true;
        const error = await options.onSubmit({
          body: nextBody,
          location: currentLocation()!,
        });
        if (submit) submit.disabled = false;
        if (error) {
          setError(error);
          return;
        }
        close();
      },
      onCancel: () => close(),
      onSignIn: options.onSignIn,
    });
    const root = document.createElement("div");
    root.className = "post-composer-body";
    root.append(form);
    marker = L.marker(latlng, {
      icon: L.divIcon({
        className: "post-composer",
        iconSize: [POPUP_SIZE + RADIUS, POPUP_SIZE],
        iconAnchor: [0, POPUP_SIZE / 2],
        html: root,
      }),
      interactive: true,
      keyboard: false,
      zIndexOffset: 1000,
    }).addTo(map);
    const el = marker.getElement();
    if (el) {
      L.DomEvent.disableClickPropagation(el);
      L.DomEvent.disableScrollPropagation(el);
      if (animate) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => el.classList.add("is-open"));
        });
      } else {
        el.classList.add("is-open", "post-composer-instant");
      }
    }
    const focus = form.querySelector<HTMLElement>("textarea, .post-composer-signin");
    focus?.focus();
    panClickToWindowCenter(map, latlng, animate);
  }

  map.on("click", (event: L.LeafletMouseEvent) => {
    open(coordinatesAt(event), { body: currentBody() });
  });

  return {
    open,
    location: currentLocation,
    setSignedIn(value: boolean) {
      if (signedIn === value) return;
      signedIn = value;
      const location = currentLocation();
      if (location) open(location, { body: signedIn ? currentBody() : "", animate: false });
    },
  };
}

/** Pan so the click sits in the window center. The popup sits to the right of that point. */
function panClickToWindowCenter(map: L.Map, latlng: L.LatLng, animate: boolean) {
  const mapRect = map.getContainer().getBoundingClientRect();
  const size = map.getSize();
  const windowCenterInMap = L.point(size.x / 2, window.innerHeight / 2 - mapRect.top);
  const clickInMap = map.latLngToContainerPoint(latlng);
  map.panBy(clickInMap.subtract(windowCenterInMap), { animate, duration: PAN_SECONDS });
}

function buildForm(options: {
  signedIn: boolean;
  body: string;
  onSubmit: (body: string) => Promise<void>;
  onCancel: () => void;
  onSignIn: () => void;
}) {
  const form = document.createElement("form");
  form.className = "post-composer-card";
  if (options.signedIn) {
    form.innerHTML = `
      <button class="post-composer-close" type="button" aria-label="Cancel">&times;</button>
      <label>
        Note
        <textarea name="body" rows="6" maxlength="2000" required></textarea>
      </label>
      <p class="post-composer-error" role="status"></p>
      <button type="submit">Post</button>
    `;
    const textarea = form.querySelector("textarea")!;
    textarea.value = options.body;
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void options.onSubmit(textarea.value);
    });
  } else {
    form.innerHTML = `
      <button class="post-composer-close" type="button" aria-label="Cancel">&times;</button>
      <p class="post-composer-prompt">Sign in to post a note here.</p>
      <button class="post-composer-signin" type="button">Sign in with Commons</button>
    `;
    form.querySelector(".post-composer-signin")!.addEventListener("click", () => options.onSignIn());
    form.addEventListener("submit", (event) => event.preventDefault());
  }
  form.querySelector(".post-composer-close")!.addEventListener("click", () => options.onCancel());
  return form;
}
