<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, shallowRef, watch } from "vue";
import AppHeader from "./components/AppHeader.vue";
import LocationDialog from "./components/LocationDialog.vue";
import ProfileView from "./components/ProfileView.vue";
import MyNotesView from "./components/MyNotesView.vue";
import SearchBar from "./components/SearchBar.vue";
import SignInView from "./components/SignInView.vue";
import SignUpView from "./components/SignUpView.vue";
import { useLocation } from "./composables/useLocation.ts";
import { usePosts } from "./composables/usePosts.ts";
import { useSaves } from "./composables/useSaves.ts";
import { useSession } from "./composables/useSession.ts";
import { useView } from "./composables/useView.ts";
import { mountMapUi, type MapUi } from "./mapUi.ts";

const NOTES_POLL_MS = 5_000;

const { viewer, signedIn, who, accountLabel, status, busy, loadMe, startCommons, finishCommons, logout } =
  useSession();
const { posts, poll, create } = usePosts();
const { refresh: refreshSaves, poll: pollSaves } = useSaves();
const {
  consented,
  hint,
  busy: locationBusy,
  dialogOpen,
  applySession,
  signedOut: locationSignedOut,
  acceptOffer,
  skipOffer,
  onToggle,
} = useLocation();
const { view, compact, menuOpen, showMap, showNotes, showProfile, showSignIn, showSignUp, goFind } = useView();
const mapEl = shallowRef<HTMLElement>();
const mapUi = shallowRef<MapUi>();
const searchBar = shallowRef<{ cancel: () => void; isActive: () => boolean }>();
let pollId: number | undefined;

const AUTH_VIEWS: readonly string[] = ["signin", "signup"];

function signIn() {
  if (signedIn.value) return;
  mapUi.value?.stashPendingPost();
  window.location.hash = "signin";
}

async function onPasswordSignIn() {
  goFind();
  await applySession(true);
}

function syncGps() {
  if (signedIn.value && consented.value) {
    mapUi.value?.startGps((message) => {
      hint.value = message;
    });
  } else {
    mapUi.value?.stopGps();
  }
}

watch(posts, (list) => {
  mapUi.value?.render(list);
});

watch([signedIn, consented], () => {
  syncGps();
});

watch(signedIn, () => {
  void refreshSaves();
});

async function showOnMap(note: (typeof posts.value)[number]) {
  searchBar.value?.cancel();
  goFind();
  await nextTick();
  mapUi.value?.onView("find");
  mapUi.value?.openNote(note);
}

watch(view, async (next, prev) => {
  if (signedIn.value && AUTH_VIEWS.includes(next)) {
    goFind();
    return;
  }
  if (next !== "find") {
    mapUi.value?.onView(next);
    return;
  }
  await nextTick();
  mapUi.value?.onView("find");
  if (AUTH_VIEWS.includes(prev)) mapUi.value?.restorePendingPost();
});

onMounted(async () => {
  mapUi.value = mountMapUi({
    map: mapEl.value!,
    onSignIn: signIn,
    onCreate: create,
    onNoteOpen: () => searchBar.value?.cancel(),
    consumeMapClick: () => {
      if (!searchBar.value?.isActive()) return false;
      searchBar.value.cancel();
      return true;
    },
  });
  mapUi.value.render(posts.value);

  let offer = false;
  if (window.location.pathname === "/auth/commons/callback") {
    status.value = "Signing in with Commons…";
    offer = (await finishCommons()).offer;
  } else {
    await loadMe();
  }

  if (!signedIn.value && view.value === "settings") goFind();
  if (signedIn.value && AUTH_VIEWS.includes(view.value)) goFind();
  if (viewer.value) await applySession(offer);
  else locationSignedOut();
  mapUi.value.restorePendingPost();
  void poll();
  void refreshSaves();

  pollId = window.setInterval(() => {
    if (document.hidden) return;
    void pollSaves();
    if (mapUi.value?.isEditing()) return;
    void poll();
  }, NOTES_POLL_MS);
});

onUnmounted(() => {
  if (pollId !== undefined) window.clearInterval(pollId);
  mapUi.value?.destroy();
});
</script>

<template>
  <AppHeader
    :view="view"
    :signed-in="signedIn"
    :account-label="accountLabel"
    :compact="compact"
    v-model:menu-open="menuOpen"
    @sign-in="signIn"
  />
  <p id="status" role="status" v-show="status">{{ status }}</p>
  <main>
    <div id="map" ref="mapEl" role="application" aria-label="Map" v-show="showMap"></div>
    <SearchBar
      v-if="showMap && mapUi"
      ref="searchBar"
      :get-center="() => mapUi?.getCenter()"
      @adjusting="(value) => mapUi?.setRadiusMiles(value)"
      @active="(open) => { if (open) mapUi?.dismissPopups(); }"
      @select="(note) => mapUi?.openNote(note)"
      @sign-in="signIn"
    />
    <MyNotesView :visible="showNotes" @open="showOnMap" @sign-in="signIn" />
    <ProfileView
      :visible="showProfile"
      :signed-in="signedIn"
      :who="who"
      :busy="busy"
      :consented="consented"
      :location-hint="hint"
      :location-busy="locationBusy"
      @sign-in="signIn"
      @sign-out="logout"
      @location="onToggle"
    />
    <SignInView :visible="showSignIn" @signed-in="onPasswordSignIn" @commons="startCommons" />
    <SignUpView :visible="showSignUp" @signed-in="onPasswordSignIn" />
  </main>
  <LocationDialog v-if="dialogOpen" :busy="locationBusy" @accept="acceptOffer" @skip="skipOffer" />
</template>
