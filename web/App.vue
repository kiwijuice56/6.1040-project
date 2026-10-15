<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from "vue";
import { bindMap, type MapUi } from "./app.ts";
import AppHeader from "./components/AppHeader.vue";
import ProfileView from "./components/ProfileView.vue";
import { useSession } from "./composables/useSession.ts";
import { useView } from "./composables/useView.ts";

const { viewer, signedIn, who, accountLabel, status, busy, loadMe, startCommons, finishCommons, logout } =
  useSession();
const { view, compact, menuOpen, showMap, showNotes, showProfile, goFind } = useView();
const mapEl = ref<HTMLElement>();
let mapUi: MapUi | undefined;

function signIn() {
  mapUi?.stashPendingPost();
  const popupSignIn = document.querySelector<HTMLButtonElement>(".post-composer-signin");
  if (popupSignIn) popupSignIn.disabled = true;
  void startCommons();
}

onMounted(async () => {
  mapUi = bindMap({
    map: mapEl.value!,
    viewer: () => viewer.value,
    onSignIn: signIn,
  });

  let offer = false;
  if (window.location.pathname === "/auth/commons/callback") {
    status.value = "Signing in with Commons…";
    offer = (await finishCommons()).offer;
  } else {
    await loadMe();
  }

  if (!signedIn.value && view.value === "settings") goFind();
  mapUi.setSession(viewer.value, { offer });
  mapUi.restorePendingPost();
});

watch(view, async (next) => {
  if (next !== "find") {
    mapUi?.onView(next);
    return;
  }
  await nextTick();
  mapUi?.onView("find");
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
      @sign-in="signIn"
      @sign-out="logout"
    />
  </main>
  <div id="location-consent" class="location-consent" hidden>
    <div
      class="location-consent-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-consent-title"
    >
      <h2 id="location-consent-title">Share your location?</h2>
      <p>Sticky can keep the map on you so nearby notes are easier to find.</p>
      <div class="location-consent-actions">
        <button type="button" id="location-accept">Accept</button>
        <button type="button" id="location-skip">Continue without location</button>
      </div>
    </div>
  </div>
</template>
