<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { usePosts } from "../composables/usePosts.ts";
import { useSession } from "../composables/useSession.ts";
import { accentFor } from "../palette.ts";
import type { PublicNote, VoteChoice } from "../types.ts";
import NoteBookmark from "./NoteBookmark.vue";

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

const { viewer, signedIn } = useSession();
const { vote, mine: loadMine, edit, remove } = usePosts();

const owned = computed(() => Boolean(props.note.username && props.note.username === viewer.value));
const savedBody = ref(props.note.body);
const body = ref(savedBody.value);
const count = ref(typeof props.note.count === "number" ? props.note.count : 0);
const mine = ref<VoteChoice | undefined>();
const error = ref("");
const voting = ref(false);
const mode = ref<"view" | "edit">("view");
const fading = ref(false);
const acting = ref(false);

const tally = computed(() => (count.value > 0 ? `+${count.value}` : String(count.value)));

onMounted(() => {
  if (signedIn.value && !owned.value) {
    void loadMine({ post: props.note.post }).then((choice) => {
      mine.value = choice;
    });
  }
});

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function choose(next: VoteChoice) {
  if (owned.value) return;
  if (!signedIn.value) {
    emit("signIn");
    return;
  }
  if (voting.value) return;
  voting.value = true;
  const steps: Array<"upvote" | "downvote" | "unvote"> = [];
  if (mine.value === next) steps.push("unvote");
  else {
    if (mine.value) steps.push("unvote");
    steps.push(next === "up" ? "upvote" : "downvote");
  }
  let failed: string | undefined;
  for (const action of steps) {
    const message = await vote({ post: props.note.post, action });
    if (message) {
      failed = message;
      break;
    }
    if (action === "unvote") {
      count.value += mine.value === "up" ? -1 : 1;
      mine.value = undefined;
    } else {
      mine.value = next;
      count.value += next === "up" ? 1 : -1;
    }
  }
  voting.value = false;
  error.value = failed ?? "";
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
    :style="{ '--note-tint': accentFor(note.post) }"
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
      <div class="note-reader-votes">
        <button
          class="note-vote note-vote-up"
          type="button"
          aria-label="Upvote"
          :aria-pressed="mine === 'up'"
          :disabled="owned || voting"
          :title="owned ? 'You can\'t vote on your own note' : undefined"
          @click="choose('up')"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5.2 20.2 18H3.8z" /></svg>
        </button>
        <span class="note-vote-count" :class="{ 'is-up': count > 0, 'is-down': count < 0 }">{{ tally }}</span>
        <button
          class="note-vote note-vote-down"
          type="button"
          aria-label="Downvote"
          :aria-pressed="mine === 'down'"
          :disabled="owned || voting"
          :title="owned ? 'You can\'t vote on your own note' : undefined"
          @click="choose('down')"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 18.8 3.8 6h16.4z" /></svg>
        </button>
      </div>
    </div>
  </div>
</template>
