import L from "leaflet";
import { createApp, type App } from "vue";
import NoteReader from "./components/NoteReader.vue";
import type { StickyWireHttp } from "../generated/wire.ts";
import { dismissPopup, placePopup } from "./popup.ts";

export type PublicNote = StickyWireHttp["/posts/list"]["output"]["posts"][number];
export type VoteChoice = "up" | "down";

const DOT = 16;

export function bindNotes(
  map: L.Map,
  options: {
    onOpen?: () => void;
    onSignIn?: () => void;
  } = {},
) {
  const dots = new Map<PublicNote["post"], L.Marker>();
  const notes = new Map<PublicNote["post"], PublicNote>();
  let reader: L.Marker | undefined;
  let readerApp: App | undefined;
  let reading: PublicNote["post"] | undefined;
  let editing = false;

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
        const current = notes.get(note.post);
        if (current) open(current);
      });
    });
    marker.addTo(map);
    dots.set(note.post, marker);
  }

  function hideDot(post: PublicNote["post"]) {
    dots.get(post)?.remove();
    dots.delete(post);
  }

  function closeReader(motion: { animate?: boolean } = {}): boolean {
    if (!reader) return false;
    const post = reading;
    editing = false;
    readerApp?.unmount();
    readerApp = undefined;
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
    editing = false;
    const { marker, host } = placePopup(map, L.latLng(note.location.latitude, note.location.longitude));
    readerApp = createApp(NoteReader, {
      note,
      onClose: () => {
        queueMicrotask(() => closeReader());
      },
      onEditing: (value: boolean) => {
        editing = value;
      },
      onSignIn: () => options.onSignIn?.(),
    });
    readerApp.mount(host);
    reader = marker;
  }

  function render(next: readonly PublicNote[]) {
    const keep = new Set(next.map((item) => item.post));
    for (const post of [...notes.keys()]) {
      if (keep.has(post)) continue;
      notes.delete(post);
      hideDot(post);
      if (reading === post) closeReader({ animate: false });
    }
    for (const item of next) {
      notes.set(item.post, item);
      showDot(item);
    }
  }

  return {
    render,
    closeIfOpen: () => closeReader(),
    isEditing: () => editing,
  };
}
