<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, shallowRef, watch } from "vue";
import AppHeader from "./components/AppHeader.vue";
import LocationDialog from "./components/LocationDialog.vue";
import ProfileView from "./components/ProfileView.vue";
import { useLocation } from "./composables/useLocation.ts";
import { usePosts } from "./composables/usePosts.ts";
import { useSession } from "./composables/useSession.ts";
import { useView } from "./composables/useView.ts";
import { mountMapUi, type MapUi } from "./mapUi.ts";

const NOTES_POLL_MS = 5_000;

const { viewer, signedIn, who, accountLabel, status, busy, loadMe, startCommons, finishCommons, logout } =
  useSession();
const { posts, poll, create } = usePosts();
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
const { view, compact, menuOpen, showMap, showNotes, showProfile, goFind } = useView();
const mapEl = shallowRef<HTMLElement>();
const mapUi = shallowRef<MapUi>();
let pollId: number | undefined;

function signIn() {
  mapUi.value?.stashPendingPost();
  void startCommons();
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

watch(view, async (next) => {
  if (next !== "find") {
    mapUi.value?.onView(next);
    return;
  }
  await nextTick();
  mapUi.value?.onView("find");
});

onMounted(async () => {
  mapUi.value = mountMapUi({
    map: mapEl.value!,
    onSignIn: signIn,
    onCreate: create,
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
  if (viewer.value) await applySession(offer);
  else locationSignedOut();
  mapUi.value.restorePendingPost();
  syncGps();
  void poll();

  pollId = window.setInterval(() => {
    if (document.hidden || mapUi.value?.isEditing()) return;
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
    <section id="view-notes" class="app-view" v-show="showNotes" aria-labelledby="notes-heading">
      <h2 id="notes-heading" class="visually-hidden">My notes</h2>
    </section>
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
  </main>
  <LocationDialog v-if="dialogOpen" :busy="locationBusy" @accept="acceptOffer" @skip="skipOffer" />
</template>
