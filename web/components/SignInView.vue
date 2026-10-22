<script setup lang="ts">
import { ref, watch } from "vue";
import { useAuthDraft } from "../composables/useAuthDraft.ts";
import { useSession } from "../composables/useSession.ts";

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  signedIn: [];
  commons: [];
}>();

const { login, busy } = useSession();
const { give } = useAuthDraft();
const username = ref("");
const password = ref("");
const error = ref("");

watch(
  () => props.visible,
  (on) => {
    if (on) return;
    password.value = "";
    error.value = "";
  },
);

async function submit() {
  error.value = "";
  const message = await login({ username: username.value.trim(), password: password.value });
  if (message) {
    error.value = message;
    return;
  }
  username.value = "";
  password.value = "";
  emit("signedIn");
}

function toSignUp() {
  give({ username: username.value.trim(), password: password.value });
}
</script>

<template>
  <section id="view-signin" class="app-view auth-view" v-show="visible" aria-labelledby="signin-heading">
    <div class="auth-card">
      <h2 id="signin-heading">Log in</h2>
      <form class="auth-form" @submit.prevent="submit">
        <label>
          Username
          <input v-model="username" name="username" autocomplete="username" required />
        </label>
        <label>
          Password
          <input v-model="password" name="password" type="password" autocomplete="current-password" required />
        </label>
        <p class="auth-error" role="alert" v-show="error">{{ error }}</p>
        <button type="submit" :disabled="busy">Log in</button>
      </form>
      <hr class="auth-divider" />
      <div class="auth-alternatives">
        <button class="auth-commons" type="button" :disabled="busy" @click="emit('commons')">
          <svg class="auth-commons-icon" viewBox="14 11 39 39" aria-hidden="true" fill="currentColor">
            <rect x="15" y="15" width="16" height="16" rx="4.5" />
            <rect x="15" y="33" width="16" height="16" rx="4.5" />
            <rect x="33" y="33" width="16" height="16" rx="4.5" />
            <circle cx="23" cy="32" r="2.7" />
            <circle cx="32" cy="41" r="2.7" />
            <rect x="36" y="12" width="16" height="16" rx="4.5" transform="rotate(12 44 20)" />
          </svg>
          Login or Sign-up with Commons
        </button>
        <a class="auth-link-button" href="#signup" @click="toSignUp">Sign-up without Commons</a>
      </div>
    </div>
  </section>
</template>
