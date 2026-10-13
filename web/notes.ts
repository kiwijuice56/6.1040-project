import L from "leaflet";
import type { StickyWireHttp } from "../generated/wire.ts";
import { dismissPopup, placePopup } from "./popup.ts";

export type PublicNote = StickyWireHttp["/posts/list"]["output"]["posts"][number];

const DOT = 16;
const FADE_MS = 100;

export function bindNotes(
  map: L.Map,
  options: {
    onOpen?: () => void;
    viewer?: () => string | undefined;
    onEdit?: (input: { post: PublicNote["post"]; body: string }) => Promise<string | undefined>;
    onDelete?: (input: { post: PublicNote["post"] }) => Promise<string | undefined>;
  } = {},
) {
  const dots = new Map<PublicNote["post"], L.Marker>();
  const notes = new Map<PublicNote["post"], PublicNote>();
  let reader: L.Marker | undefined;
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
        open(note);
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
    const card = buildReader(note, {
      owned: Boolean(note.username && note.username === options.viewer?.()),
      onClose: () => closeReader(),
      onEdit: async (body) => {
        const error = await options.onEdit?.({ post: note.post, body });
        if (error) return error;
        const stored = notes.get(note.post);
        if (stored) stored.body = body;
        editing = false;
        return;
      },
      onDelete: async () => {
        const error = await options.onDelete?.({ post: note.post });
        if (error) return error;
        notes.delete(note.post);
        hideDot(note.post);
        editing = false;
        dismissPopup(reader);
        reader = undefined;
        reading = undefined;
        return;
      },
      onEditing: (value) => {
        editing = value;
      },
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
    isEditing: () => editing,
  };
}

function buildReader(
  note: PublicNote,
  options: {
    owned: boolean;
    onClose: () => void;
    onEdit: (body: string) => Promise<string | undefined>;
    onDelete: () => Promise<string | undefined>;
    onEditing: (value: boolean) => void;
  },
) {
  const card = document.createElement("div");
  card.className = "post-composer-card note-reader";
  card.innerHTML = `
    <button class="post-composer-close" type="button" aria-label="Close">&times;</button>
    <textarea class="note-reader-body" maxlength="2000" readonly></textarea>
    <p class="note-reader-author"></p>
  `;
  const body = card.querySelector("textarea")!;
  body.value = note.body;
  const author = card.querySelector(".note-reader-author")!;
  if (note.username) author.textContent = note.username;
  else author.remove();
  card.querySelector(".post-composer-close")!.addEventListener("click", () => options.onClose());

  if (!options.owned) return card;

  const actions = document.createElement("div");
  actions.className = "note-reader-actions";
  const primary = document.createElement("button");
  primary.type = "button";
  primary.textContent = "Edit";
  const secondary = document.createElement("button");
  secondary.type = "button";
  secondary.className = "note-delete";
  secondary.textContent = "Delete";
  const error = document.createElement("p");
  error.className = "post-composer-error";
  error.hidden = true;
  actions.append(primary, secondary);
  card.append(error, actions);

  let mode: "view" | "edit" = "view";
  let fading = false;

  function setError(message: string) {
    error.hidden = !message;
    error.textContent = message;
  }

  async function showView() {
    if (mode === "view") return;
    fading = true;
    actions.classList.add("is-fading");
    await wait(FADE_MS);
    mode = "view";
    options.onEditing(false);
    body.readOnly = true;
    body.value = note.body;
    primary.textContent = "Edit";
    primary.disabled = false;
    secondary.textContent = "Delete";
    secondary.className = "note-delete";
    secondary.disabled = false;
    setError("");
    actions.classList.remove("is-fading");
    fading = false;
  }

  async function showEdit() {
    if (mode === "edit") return;
    fading = true;
    actions.classList.add("is-fading");
    await wait(FADE_MS);
    mode = "edit";
    options.onEditing(true);
    body.readOnly = false;
    body.focus();
    primary.textContent = "Confirm";
    primary.disabled = false;
    secondary.textContent = "Cancel";
    secondary.className = "";
    secondary.disabled = false;
    setError("");
    actions.classList.remove("is-fading");
    fading = false;
  }

  primary.addEventListener("click", () => {
    if (fading) return;
    if (mode === "view") {
      void showEdit();
      return;
    }
    const next = body.value;
    if (next.trim() === "") {
      setError("A post needs some text.");
      return;
    }
    primary.disabled = true;
    secondary.disabled = true;
    void options.onEdit(next).then((message) => {
      primary.disabled = false;
      secondary.disabled = false;
      if (message) {
        setError(message);
        return;
      }
      note.body = next;
      void showView();
    });
  });

  secondary.addEventListener("click", () => {
    if (fading) return;
    if (mode === "edit") {
      void showView();
      return;
    }
    primary.disabled = true;
    secondary.disabled = true;
    void options.onDelete().then((message) => {
      if (message) {
        primary.disabled = false;
        secondary.disabled = false;
        setError(message);
      }
    });
  });

  return card;
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
