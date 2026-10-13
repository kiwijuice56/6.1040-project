import L from "leaflet";
import { coordinatesAt, type MapCoordinate } from "./map.ts";
import { dismissPopup, placePopup } from "./popup.ts";

export type ComposerOpenOptions = {
  body?: string;
  animate?: boolean;
};

export function bindPostComposer(
  map: L.Map,
  options: {
    onSubmit: (input: { body: string; location: MapCoordinate }) => Promise<string | undefined>;
    onSignIn: () => void;
    interceptClick?: () => boolean;
  },
) {
  let marker: L.Marker | undefined;
  let form: HTMLFormElement | undefined;
  let signedIn = false;

  function close(motion: { animate?: boolean } = {}) {
    dismissPopup(marker, motion);
    marker = undefined;
    form = undefined;
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
    marker = placePopup(map, latlng, form, { animate });
    const focus = form.querySelector<HTMLElement>("textarea, .post-composer-signin");
    focus?.focus();
  }

  map.on("click", (event: L.LeafletMouseEvent) => {
    if (options.interceptClick?.()) return;
    open(coordinatesAt(event), { body: currentBody() });
  });

  return {
    open,
    close,
    location: currentLocation,
    setSignedIn(value: boolean) {
      if (signedIn === value) return;
      signedIn = value;
      const location = currentLocation();
      if (location) open(location, { body: signedIn ? currentBody() : "", animate: false });
    },
  };
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
        write a sticky note!
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
