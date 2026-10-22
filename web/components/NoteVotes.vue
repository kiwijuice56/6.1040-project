<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { usePosts } from "../composables/usePosts.ts";
import { useSession } from "../composables/useSession.ts";
import type { PublicNote, VoteChoice } from "../types.ts";

const props = defineProps<{
  note: PublicNote;
}>();

const emit = defineEmits<{
  signIn: [];
  error: [message: string];
}>();

const { viewer, signedIn } = useSession();
const { vote, mine: loadMine } = usePosts();

const owned = computed(() => Boolean(props.note.username && props.note.username === viewer.value));
const count = ref(typeof props.note.count === "number" ? props.note.count : 0);
const mine = ref<VoteChoice | undefined>();
const voting = ref(false);

watch(
  () => props.note.count,
  (next) => {
    if (!voting.value && typeof next === "number") count.value = next;
  },
);

const tally = computed(() => (count.value > 0 ? `+${count.value}` : String(count.value)));

onMounted(() => {
  if (signedIn.value && !owned.value) {
    void loadMine({ post: props.note.post }).then((choice) => {
      mine.value = choice;
    });
  }
});

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
  let choice = mine.value;
  let total = count.value;
  for (const action of steps) {
    const message = await vote({ post: props.note.post, action });
    if (message) {
      failed = message;
      break;
    }
    if (action === "unvote") {
      total += choice === "up" ? -1 : 1;
      choice = undefined;
    } else {
      choice = next;
      total += next === "up" ? 1 : -1;
    }
  }
  mine.value = choice;
  count.value = total;
  voting.value = false;
  emit("error", failed ?? "");
}
</script>

<template>
  <div class="note-reader-votes">
    <button
      class="note-vote note-vote-up"
      type="button"
      aria-label="Upvote"
      :aria-pressed="mine === 'up'"
      :disabled="owned"
      :title="owned ? 'You can\'t vote on your own note' : undefined"
      @click="choose('up')"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5.2 20.2 18H3.8z" /></svg>
    </button>
    <span class="note-vote-count" :class="{ 'is-up': mine === 'up', 'is-down': mine === 'down' }">{{ tally }}</span>
    <button
      class="note-vote note-vote-down"
      type="button"
      aria-label="Downvote"
      :aria-pressed="mine === 'down'"
      :disabled="owned"
      :title="owned ? 'You can\'t vote on your own note' : undefined"
      @click="choose('down')"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 18.8 3.8 6h16.4z" /></svg>
    </button>
  </div>
</template>
