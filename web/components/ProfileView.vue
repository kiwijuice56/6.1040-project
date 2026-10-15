<script setup lang="ts">
defineProps<{
  visible: boolean;
  signedIn: boolean;
  who: string;
  busy: boolean;
}>();

const emit = defineEmits<{
  signIn: [];
  signOut: [];
}>();
</script>

<template>
  <section id="view-settings" class="app-view" :hidden="!visible" aria-labelledby="settings-heading">
    <h2 id="settings-heading" class="visually-hidden">My profile</h2>
    <div id="session">
      <p id="who" :hidden="!signedIn">{{ who }}</p>
      <label class="location-toggle" id="location-toggle" hidden>
        <input id="use-location" type="checkbox" />
        Use my location
      </label>
      <p id="location-status" class="location-status" hidden></p>
      <button v-if="!signedIn" id="signin" type="button" :disabled="busy" @click="emit('signIn')">
        Sign in with Commons
      </button>
      <button v-else id="signout" type="button" :disabled="busy" @click="emit('signOut')">Sign out</button>
    </div>
  </section>
</template>
