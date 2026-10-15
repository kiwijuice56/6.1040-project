import type { Map as LeafletMap } from "leaflet";
import { bindPostComposer } from "./composer.ts";
import type { AppView } from "./composables/useView.ts";
import { bindLocation, SHARING_LOCATION } from "./location.ts";
import { api } from "./client.ts";
import { mountMap, type MapCoordinate } from "./map.ts";
import { bindNotes, type PublicNote } from "./notes.ts";

const PENDING_POST = "sticky.pendingPost";

let mapInstance: LeafletMap | undefined;

export type MapUi = {
  setSession(username: string | undefined, options?: { offer?: boolean }): void;
  onView(view: AppView): void;
  render(posts: readonly PublicNote[]): void;
  isEditing(): boolean;
  stashPendingPost(): void;
  restorePendingPost(): void;
};

/** Leaflet notes/composer/location on a Vue-owned map node. Post state stays in Vue. */
export function bindMap(options: {
  map: HTMLElement;
  viewer: () => string | undefined;
  onSignIn: () => void;
  onCreate: (input: { body: string; location: PublicNote["location"] }) => Promise<string | undefined>;
  onEdit: (input: { post: PublicNote["post"]; body: string }) => Promise<string | undefined>;
  onDelete: (input: { post: PublicNote["post"] }) => Promise<string | undefined>;
  onVote: (input: {
    post: PublicNote["post"];
    action: "upvote" | "downvote" | "unvote";
  }) => Promise<string | undefined>;
  onMine: (input: { post: PublicNote["post"] }) => Promise<"up" | "down" | undefined>;
}): MapUi {
  mapInstance?.remove();
  mapInstance = undefined;

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

  const pending = takePendingPost();
  const map = mountMap(options.map, pending ? { center: pending } : {});
  mapInstance = map;
  const locating = bindLocation(map, {
    status: () => api["/location/status"]({ feature: SHARING_LOCATION }),
    consent: () => api["/location/consent"]({ feature: SHARING_LOCATION }),
    withdraw: () => api["/location/withdraw"]({ feature: SHARING_LOCATION }),
  });
  let closeComposer = () => {};
  const notes = bindNotes(map, {
    onOpen: () => closeComposer(),
    viewer: () => options.viewer(),
    onSignIn: () => options.onSignIn(),
    onMine: options.onMine,
    onVote: options.onVote,
    onEdit: options.onEdit,
    onDelete: options.onDelete,
  });
  const composer = bindPostComposer(map, {
    interceptClick: () => notes.closeIfOpen(),
    onSignIn: () => options.onSignIn(),
    onSubmit: options.onCreate,
  });
  closeComposer = () => composer.close();

  return {
    setSession(username, extras = {}) {
      composer.setSignedIn(Boolean(username));
      if (username) void locating.signedIn(username, extras.offer === true);
      else locating.signedOut();
    },
    onView(view) {
      if (view !== "find") {
        notes.closeIfOpen();
        composer.close();
        return;
      }
      map.invalidateSize();
    },
    render(posts) {
      notes.render(posts);
    },
    isEditing: () => notes.isEditing(),
    stashPendingPost() {
      const location = composer.location();
      if (location) sessionStorage.setItem(PENDING_POST, JSON.stringify(location));
    },
    restorePendingPost() {
      if (pending) composer.open(pending, { animate: false });
    },
  };
}
