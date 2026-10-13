import L from "leaflet";
import type { MapCoordinate } from "./map.ts";
import { dismissPopup, placePopup } from "./popup.ts";

export type PublicNote = {
  post: string;
  body: string;
  author: string;
  username: string | null;
  location: MapCoordinate;
};

const DOT = 16;

export function bindNotes(
  map: L.Map,
  options: {
    onOpen?: () => void;
  } = {},
) {
  const dots = new Map<string, L.Marker>();
  const notes = new Map<string, PublicNote>();
  let reader: L.Marker | undefined;
  let reading: string | undefined;

  function showDot(note: PublicNote) {
    if (dots.has(note.post) || reading === note.post) return;
    const marker = L.marker([note.location.latitude, note.location.longitude], {
      icon: L.divIcon({
        className: "note-dot-icon",
        iconSize: [DOT, DOT],
        iconAnchor: [DOT / 2, DOT / 2],
        html: `<span class="map-dot"></span>`,
      }),
      interactive: true,
      keyboard: false,
      riseOnHover: true,
    });
    marker.on("add", () => {
      const el = marker.getElement();
      if (!el) return;
      L.DomEvent.disableClickPropagation(el);
      el.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        open(note);
      });
    });
    marker.addTo(map);
    dots.set(note.post, marker);
  }

  function hideDot(post: string) {
    dots.get(post)?.remove();
    dots.delete(post);
  }

  function closeReader(motion: { animate?: boolean } = {}): boolean {
    if (!reader) return false;
    const post = reading;
    dismissPopup(reader, motion);
    reader = undefined;
    reading = undefined;
    if (post) {
      const note = notes.get(post);
      if (note) showDot(note);
    }
    return true;
  }

  function open(note: PublicNote) {
    options.onOpen?.();
    if (reading === note.post) return;
    closeReader();
    hideDot(note.post);
    reading = note.post;
    const card = buildReader(note, () => {
      closeReader();
    });
    reader = placePopup(map, L.latLng(note.location.latitude, note.location.longitude), card);
  }

  function render(next: readonly PublicNote[]) {
    const keep = new Set(next.map((note) => note.post));
    for (const post of [...notes.keys()]) {
      if (keep.has(post)) continue;
      notes.delete(post);
      hideDot(post);
      if (reading === post) closeReader({ animate: false });
    }
    for (const note of next) {
      notes.set(note.post, note);
      showDot(note);
    }
  }

  return {
    render,
    closeIfOpen: () => closeReader(),
  };
}

function buildReader(note: PublicNote, onClose: () => void) {
  const card = document.createElement("div");
  card.className = "post-composer-card note-reader";
  card.innerHTML = `
    <button class="post-composer-close" type="button" aria-label="Close">&times;</button>
    <p class="note-reader-body"></p>
    <p class="note-reader-author"></p>
  `;
  card.querySelector(".note-reader-body")!.textContent = note.body;
  const author = card.querySelector(".note-reader-author")!;
  if (note.username) author.textContent = note.username;
  else author.remove();
  card.querySelector(".post-composer-close")!.addEventListener("click", () => onClose());
  return card;
}
