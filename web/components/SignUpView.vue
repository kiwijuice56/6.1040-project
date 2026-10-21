<script setup lang="ts">
import { ref, watch } from "vue";
import { useAuthDraft } from "../composables/useAuthDraft.ts";
import { useSession } from "../composables/useSession.ts";

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  signedIn: [];
}>();

const { register, busy } = useSession();
const { take } = useAuthDraft();
const username = ref("");
const password = ref("");
const error = ref("");

watch(
  () => props.visible,
  (on) => {
    if (on) {
      const draft = take();
      if (draft?.username) username.value = draft.username;
      if (draft?.password) password.value = draft.password;
      return;
    }
    password.value = "";
    error.value = "";
  },
);

async function submit() {
  error.value = "";
  const message = await register({ username: username.value.trim(), password: password.value });
  if (message) {
    error.value = message;
    return;
  }
  username.value = "";
  password.value = "";
  emit("signedIn");
}
</script>

<template>
  <section id="view-signup" class="app-view auth-view" v-show="visible" aria-labelledby="signup-heading">
    <div class="auth-card">
      <h2 id="signup-heading">Sign up</h2>
      <form class="auth-form" @submit.prevent="submit">
        <label>
          Username
          <input v-model="username" name="username" autocomplete="username" required aria-describedby="signup-username-rule" />
          <span id="signup-username-rule" class="auth-hint">3 to 32 letters, digits, _ or -. It must be unique.</span>
        </label>
        <label>
          Password
          <input
            v-model="password"
            name="password"
            type="password"
            autocomplete="new-password"
            required
            minlength="8"
            maxlength="128"
            aria-describedby="signup-password-rule"
          />
          <span id="signup-password-rule" class="auth-hint">8 to 128 characters</span>
        </label>
        <p class="auth-error" role="alert" v-show="error">{{ error }}</p>
        <button type="submit" :disabled="busy">Sign up</button>
      </form>
      <hr class="auth-divider" />
      <a class="auth-link-button" href="#signin">Back to log in</a>
    </div>
  </section>
</template>
