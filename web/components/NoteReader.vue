<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { usePosts } from "../composables/usePosts.ts";
import { useSession } from "../composables/useSession.ts";
import { accentFor } from "../palette.ts";
import type { PublicNote } from "../types.ts";
import NoteBookmark from "./NoteBookmark.vue";
import NoteVotes from "./NoteVotes.vue";

const FADE_MS = 100;

const props = withDefaults(
  defineProps<{
    note: PublicNote;
    showClose?: boolean;
    openOnClick?: boolean;
  }>(),
  { showClose: true, openOnClick: false },
);

const emit = defineEmits<{
  close: [];
  open: [];
  editing: [value: boolean];
  signIn: [];
}>();

const { viewer } = useSession();
const { edit, remove } = usePosts();

const owned = computed(() => Boolean(props.note.username && props.note.username === viewer.value));
const savedBody = ref(props.note.body);
const body = ref(savedBody.value);
const error = ref("");
const mode = ref<"view" | "edit">("view");
const fading = ref(false);
const acting = ref(false);

watch(
  () => props.note.body,
  (next) => {
    savedBody.value = next;
    if (mode.value === "view") body.value = next;
  },
);

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function showView() {
  if (mode.value === "view") return;
  fading.value = true;
  await wait(FADE_MS);
  mode.value = "view";
  emit("editing", false);
  body.value = savedBody.value;
  error.value = "";
  fading.value = false;
}

async function showEdit() {
  if (mode.value === "edit") return;
  fading.value = true;
  await wait(FADE_MS);
  mode.value = "edit";
  emit("editing", true);
  error.value = "";
  fading.value = false;
}

function onPrimary() {
  if (fading.value || acting.value) return;
  if (mode.value === "view") {
    void showEdit();
    return;
  }
  if (body.value.trim() === "") {
    error.value = "A post needs some text.";
    return;
  }
  acting.value = true;
  void edit({ post: props.note.post, body: body.value }).then((message) => {
    acting.value = false;
    if (message) {
      error.value = message;
      return;
    }
    savedBody.value = body.value;
    void showView();
  });
}

const press = ref({ x: 0, y: 0 });

function onPress(event: PointerEvent) {
  press.value = { x: event.clientX, y: event.clientY };
}

function onCardClick(event: MouseEvent) {
  if (!props.openOnClick || mode.value === "edit") return;
  if (event.target instanceof Element && event.target.closest("button, a")) return;
  if (Math.hypot(event.clientX - press.value.x, event.clientY - press.value.y) > 6) return;
  emit("open");
}

function onSecondary() {
  if (fading.value || acting.value) return;
  if (mode.value === "edit") {
    void showView();
    return;
  }
  acting.value = true;
  void remove({ post: props.note.post }).then((message) => {
    if (message) {
      acting.value = false;
      error.value = message;
      return;
    }
    emit("close");
  });
}
</script>

<template>
  <div
    class="post-composer-card note-reader"
    :class="{ 'is-openable': openOnClick }"
    :style="{ '--note-tint': accentFor(note.location) }"
    @pointerdown="onPress"
    @click="onCardClick"
  >
    <NoteBookmark :post="note.post" @sign-in="emit('signIn')" />
    <button
      v-if="showClose"
      class="post-composer-close"
      type="button"
      aria-label="Close"
      @pointerdown.stop
      @mousedown.stop
      @click.stop="emit('close')"
    >
      &times;
    </button>
    <textarea
      class="note-reader-body"
      maxlength="2000"
      :class="{ 'is-editing': mode === 'edit' }"
      :readonly="mode !== 'edit'"
      v-model="body"
    ></textarea>
    <div v-if="owned" class="note-reader-actions" :class="{ 'is-fading': fading }">
      <button type="button" :disabled="fading || acting" @click="onPrimary">
        {{ mode === "view" ? "Edit" : "Confirm" }}
      </button>
      <button
        type="button"
        :class="mode === 'view' ? 'note-delete' : undefined"
        :disabled="fading || acting"
        @click="onSecondary"
      >
        {{ mode === "view" ? "Delete" : "Cancel" }}
      </button>
    </div>
    <p class="post-composer-error" v-show="error">{{ error }}</p>
    <div class="note-reader-meta">
      <p class="note-reader-author" :title="note.username ?? ''">{{ note.username ?? "" }}</p>
      <NoteVotes :note="note" @sign-in="emit('signIn')" @error="error = $event" />
    </div>
  </div>
</template>
