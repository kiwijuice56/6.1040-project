<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import type { AppView } from "../composables/useView.ts";
import { logoAccents } from "../palette.ts";

const BRAND = "Sticky";
const brandColors = logoAccents(BRAND.length);

const props = defineProps<{
  view: AppView;
  signedIn: boolean;
  accountLabel: string;
  compact: boolean;
  menuOpen: boolean;
}>();

const emit = defineEmits<{
  signIn: [];
  "update:menuOpen": [value: boolean];
}>();

const toggle = ref<HTMLButtonElement>();
const nav = ref<HTMLElement>();

function onAccount(event: MouseEvent) {
  if (props.signedIn) return;
  event.preventDefault();
  emit("update:menuOpen", false);
  emit("signIn");
}

function onKey(event: KeyboardEvent) {
  if (event.key !== "Escape" || !props.menuOpen) return;
  emit("update:menuOpen", false);
  toggle.value?.focus();
}

function onDocClick(event: MouseEvent) {
  if (!props.menuOpen || !props.compact) return;
  const target = event.target;
  if (!(target instanceof Node)) return;
  if (nav.value?.contains(target) || toggle.value?.contains(target)) return;
  emit("update:menuOpen", false);
}

onMounted(() => {
  document.addEventListener("keydown", onKey);
  document.addEventListener("click", onDocClick);
});

onUnmounted(() => {
  document.removeEventListener("keydown", onKey);
  document.removeEventListener("click", onDocClick);
});
</script>

<template>
  <header>
    <h1>
      <a href="#find" class="brand" :data-text="BRAND" :aria-label="BRAND">
        <span v-for="layer in ['brand-outline', 'brand-fill']" :key="layer" :class="layer" aria-hidden="true">
          <span v-for="(letter, i) in BRAND" :key="i" :style="{ '--letter': brandColors[i] }">{{ letter }}</span>
        </span>
      </a>
    </h1>
    <button
      id="nav-menu"
      ref="toggle"
      type="button"
      :aria-expanded="menuOpen"
      aria-controls="primary-nav"
      v-show="compact"
      @click="emit('update:menuOpen', !menuOpen)"
    >
      <span class="nav-menu-bars" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </span>
      Menu
    </button>
    <nav id="primary-nav" ref="nav" aria-label="Main" v-show="!compact || menuOpen">
      <ul>
        <li>
          <a class="nav-link" href="#find" :aria-current="view === 'find' ? 'page' : undefined">
            <span class="nav-icon nav-icon-find" aria-hidden="true"></span>
            Find info
          </a>
        </li>
        <li>
          <a class="nav-link" href="#notes" :aria-current="view === 'notes' ? 'page' : undefined">
            <span class="nav-icon nav-icon-notes" aria-hidden="true"></span>
            My notes
          </a>
        </li>
        <li>
          <a
            class="nav-link"
            :href="signedIn ? '#profile' : '#signin'"
            :aria-current="
              (signedIn ? view === 'settings' : view === 'signin' || view === 'signup') ? 'page' : undefined
            "
            @click="onAccount"
          >
            <span class="nav-icon nav-icon-signin" aria-hidden="true" v-show="!signedIn"></span>
            <span class="nav-icon nav-icon-profile" aria-hidden="true" v-show="signedIn"></span>
            {{ accountLabel }}
          </a>
        </li>
      </ul>
    </nav>
  </header>
</template>
