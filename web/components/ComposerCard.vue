<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from "vue";
import { useSession } from "../composables/useSession.ts";

const props = defineProps<{
  initialBody: string;
  postNote: (body: string) => Promise<string | undefined>;
}>();

const emit = defineEmits<{
  draft: [body: string];
  cancel: [];
  signIn: [];
}>();

const { signedIn, busy } = useSession();
const body = ref(props.initialBody);
const error = ref("");
const posting = ref(false);
const textarea = ref<HTMLTextAreaElement>();
const signInButton = ref<HTMLButtonElement>();

watch(body, (value) => {
  emit("draft", value);
});

watch(signedIn, async (on) => {
  if (!on) return;
  await nextTick();
  textarea.value?.focus();
});

onMounted(() => {
  emit("draft", body.value);
  void nextTick(() => {
    (textarea.value ?? signInButton.value)?.focus();
  });
});

async function submit() {
  if (!signedIn.value) return;
  error.value = "";
  posting.value = true;
  const message = await props.postNote(body.value);
  posting.value = false;
  if (message) error.value = message;
}
</script>

<template>
  <form class="post-composer-card" @submit.prevent="submit">
    <button
      class="post-composer-close"
      type="button"
      :aria-label="signedIn ? 'Cancel' : 'Close'"
      @pointerdown.stop
      @mousedown.stop
      @click.stop="emit('cancel')"
    >
      &times;
    </button>
    <template v-if="signedIn">
      <label>
        write a sticky note!
        <textarea
          ref="textarea"
          class="is-editing"
          name="body"
          rows="6"
          maxlength="2000"
          required
          v-model="body"
        ></textarea>
      </label>
      <p class="post-composer-error" role="status">{{ error }}</p>
      <button type="submit" :disabled="posting">Post</button>
    </template>
    <template v-else>
      <p class="post-composer-prompt">Sign in to post a note here.</p>
      <button
        ref="signInButton"
        class="post-composer-signin"
        type="button"
        :disabled="busy"
        @click="emit('signIn')"
      >
        Sign in with Commons
      </button>
    </template>
  </form>
</template>
