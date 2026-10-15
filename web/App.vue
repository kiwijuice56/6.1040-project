<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { bindMap, type MapUi } from "./app.ts";
import AppHeader from "./components/AppHeader.vue";
import LocationDialog from "./components/LocationDialog.vue";
import ProfileView from "./components/ProfileView.vue";
import { useLocation } from "./composables/useLocation.ts";
import { usePosts } from "./composables/usePosts.ts";
import { useSession } from "./composables/useSession.ts";
import { useView } from "./composables/useView.ts";

const NOTES_POLL_MS = 5_000;

const { viewer, signedIn, who, accountLabel, status, busy, loadMe, startCommons, finishCommons, logout } =
  useSession();
const { posts, poll, create } = usePosts();
const {
  consented,
  hint,
  busy: locationBusy,
  dialogOpen,
  showToggle,
  applySession,
  signedOut: locationSignedOut,
  acceptOffer,
  skipOffer,
  onToggle,
} = useLocation();
const { view, compact, menuOpen, showMap, showNotes, showProfile, goFind } = useView();
const mapEl = ref<HTMLElement>();
let mapUi: MapUi | undefined;

function signIn() {
  mapUi?.stashPendingPost();
  void startCommons();
}

function syncGps() {
  if (signedIn.value && consented.value) mapUi?.startGps((message) => {
    hint.value = message;
  });
  else mapUi?.stopGps();
}

onMounted(async () => {
  mapUi = bindMap({
    map: mapEl.value!,
    onSignIn: signIn,
    onCreate: create,
  });

  watch(
    posts,
    (list) => {
      mapUi?.render(list);
    },
    { immediate: true },
  );

  let offer = false;
  if (window.location.pathname === "/auth/commons/callback") {
    status.value = "Signing in with Commons…";
    offer = (await finishCommons()).offer;
  } else {
    await loadMe();
  }

  if (!signedIn.value && view.value === "settings") goFind();
  if (viewer.value) await applySession(viewer.value, offer);
  else locationSignedOut();
  mapUi.setSignedIn(signedIn.value);
  mapUi.restorePendingPost();
  syncGps();
  void poll();

  pollId = window.setInterval(() => {
    if (document.hidden || mapUi?.isEditing()) return;
    void poll();
  }, NOTES_POLL_MS);
});

watch([signedIn, consented], () => {
  syncGps();
});

watch(view, async (next) => {
  if (next !== "find") {
    mapUi?.onView(next);
    return;
  }
  await nextTick();
  mapUi?.onView("find");
});

let pollId: number | undefined;
onUnmounted(() => {
  if (pollId !== undefined) window.clearInterval(pollId);
  mapUi?.stopGps();
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
  <p id="status" role="status" :hidden="!status">{{ status }}</p>
  <main>
    <div id="map" ref="mapEl" role="application" aria-label="Map" :hidden="!showMap"></div>
    <section id="view-notes" class="app-view" :hidden="!showNotes" aria-labelledby="notes-heading">
      <h2 id="notes-heading" class="visually-hidden">My notes</h2>
    </section>
    <ProfileView
      :visible="showProfile"
      :signed-in="signedIn"
      :who="who"
      :busy="busy"
      :show-location="showToggle"
      :consented="consented"
      :location-hint="hint"
      :location-busy="locationBusy"
      @sign-in="signIn"
      @sign-out="logout"
      @location="onToggle"
    />
  </main>
  <LocationDialog :open="dialogOpen" :busy="locationBusy" @accept="acceptOffer" @skip="skipOffer" />
</template>
