<script setup lang="ts">
import { nextTick, ref, watch } from "vue";

const props = defineProps<{
  open: boolean;
  busy: boolean;
}>();

const emit = defineEmits<{
  accept: [];
  skip: [];
}>();

const accept = ref<HTMLButtonElement>();

watch(
  () => props.open,
  async (open) => {
    if (!open) return;
    await nextTick();
    accept.value?.focus();
  },
);
</script>

<template>
  <div
    id="location-consent"
    class="location-consent"
    :hidden="!open"
    @keydown.escape="!busy && emit('skip')"
  >
    <div
      class="location-consent-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-consent-title"
    >
      <h2 id="location-consent-title">Share your location?</h2>
      <p>Sticky can keep the map on you so nearby notes are easier to find.</p>
      <div class="location-consent-actions">
        <button ref="accept" type="button" :disabled="busy" @click="emit('accept')">Accept</button>
        <button type="button" :disabled="busy" @click="emit('skip')">Continue without location</button>
      </div>
    </div>
  </div>
</template>
