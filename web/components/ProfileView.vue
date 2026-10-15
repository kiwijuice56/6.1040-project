<script setup lang="ts">
defineProps<{
  visible: boolean;
  signedIn: boolean;
  who: string;
  busy: boolean;
  consented: boolean;
  locationHint: string;
  locationBusy: boolean;
}>();

const emit = defineEmits<{
  signIn: [];
  signOut: [];
  location: [on: boolean];
}>();
</script>

<template>
  <section id="view-settings" class="app-view" v-show="visible" aria-labelledby="settings-heading">
    <h2 id="settings-heading" class="visually-hidden">My profile</h2>
    <div id="session">
      <p id="who" v-show="signedIn">{{ who }}</p>
      <label v-show="signedIn" class="location-toggle">
        <input
          type="checkbox"
          :checked="consented"
          :disabled="locationBusy"
          @change="emit('location', ($event.target as HTMLInputElement).checked)"
        />
        Use my location
      </label>
      <p class="location-status" v-show="locationHint">{{ locationHint }}</p>
      <button v-if="!signedIn" type="button" :disabled="busy" @click="emit('signIn')">
        Sign in with Commons
      </button>
      <button v-else type="button" :disabled="busy" @click="emit('signOut')">Sign out</button>
    </div>
  </section>
</template>
