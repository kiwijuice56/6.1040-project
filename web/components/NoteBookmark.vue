<script setup lang="ts">
import { computed, ref } from "vue";
import { useSaves } from "../composables/useSaves.ts";
import { useSession } from "../composables/useSession.ts";
import type { PublicNote } from "../types.ts";

const props = defineProps<{
  post: PublicNote["post"];
}>();

const emit = defineEmits<{
  signIn: [];
}>();

const { signedIn } = useSession();
const { isSaved, save, unsave } = useSaves();
const acting = ref(false);

const on = computed(() => isSaved(props.post));

async function toggle() {
  if (!signedIn.value) {
    emit("signIn");
    return;
  }
  if (acting.value) return;
  acting.value = true;
  if (on.value) await unsave(props.post);
  else await save(props.post);
  acting.value = false;
}
</script>

<template>
  <button
    class="note-bookmark"
    type="button"
    :aria-label="on ? 'Unsave note' : 'Save note'"
    :aria-pressed="on"
    :disabled="acting"
    @pointerdown.stop
    @mousedown.stop
    @click.stop="toggle"
  >
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 3.5h10a1 1 0 0 1 1 1V20l-6-3.2L6 20V4.5a1 1 0 0 1 1-1z" />
    </svg>
  </button>
</template>
