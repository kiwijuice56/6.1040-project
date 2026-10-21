<script setup lang="ts">
import { watch } from "vue";
import { useSaves } from "../composables/useSaves.ts";
import { useSession } from "../composables/useSession.ts";
import type { PublicNote } from "../types.ts";
import NoteReader from "./NoteReader.vue";

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  open: [note: PublicNote];
  signIn: [];
}>();

const { signedIn } = useSession();
const { saved, refresh } = useSaves();

watch(
  () => props.visible,
  (on) => {
    if (on) void refresh();
  },
);
</script>

<template>
  <section id="view-notes" class="app-view notes-view" v-show="visible" aria-labelledby="notes-heading">
    <h2 id="notes-heading" class="visually-hidden">My notes</h2>
    <p class="notes-empty" v-if="!signedIn">Sign in to save notes.</p>
    <p class="notes-empty" v-else-if="saved.length === 0">No notes saved.</p>
    <TransitionGroup v-else class="notes-board" name="note-list" tag="div">
      <NoteReader
        v-for="note in saved"
        :key="note.post"
        class="notes-card"
        :note="note"
        :show-close="false"
        open-on-click
        @open="emit('open', note)"
        @sign-in="emit('signIn')"
      />
    </TransitionGroup>
  </section>
</template>
