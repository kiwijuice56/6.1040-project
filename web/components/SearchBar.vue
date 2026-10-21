<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { usePosts } from "../composables/usePosts.ts";
import { useSearch } from "../composables/useSearch.ts";
import type { MapCoordinate } from "../map.ts";
import { accentFor } from "../palette.ts";
import type { PublicNote } from "../types.ts";
import NoteBookmark from "./NoteBookmark.vue";
import NoteVotes from "./NoteVotes.vue";

const props = defineProps<{
  getCenter: () => MapCoordinate | undefined;
}>();

const emit = defineEmits<{
  adjusting: [miles: number | null];
  active: [open: boolean];
  select: [note: PublicNote];
  signIn: [];
}>();

const { posts } = usePosts();
const { query, miles, hits, searched, cancel } = useSearch({
  posts,
  getCenter: () => props.getCenter(),
});

const showPanel = computed(() => query.value.trim() !== "" && (hits.value.length > 0 || searched.value));
const showEmpty = computed(() => searched.value && hits.value.length === 0);

const overlayEl = ref<HTMLElement>();
const barEl = ref<HTMLElement>();
const shellEl = ref<HTMLElement>();
const panelEl = ref<HTMLElement>();
const panelHeight = ref(0);
const clipped = ref(false);
const renderPanel = ref(false);
const paintedHits = ref<PublicNote[]>([]);
const paintedEmpty = ref(false);

const adjusting = ref(false);

const milesLabel = computed(() => {
  const value = Math.round(miles.value * 10) / 10;
  return value === 1 ? "1 mile" : `${value} miles`;
});

watch([adjusting, miles], () => {
  emit("adjusting", adjusting.value ? miles.value : null);
});

function availableHeight() {
  const overlay = overlayEl.value;
  const bar = barEl.value;
  const main = overlay?.parentElement;
  if (!overlay || !main) return Infinity;
  return Math.max(0, main.clientHeight - overlay.offsetTop - (bar?.offsetHeight ?? 0) - 12);
}

function contentHeight() {
  const el = panelEl.value;
  if (!el) return 0;
  const prevHeight = el.style.height;
  const prevOverflow = el.style.overflow;
  el.style.height = "auto";
  el.style.overflow = "visible";
  const natural = el.offsetHeight;
  el.style.height = prevHeight;
  el.style.overflow = prevOverflow;
  const max = availableHeight();
  clipped.value = natural > max;
  return clipped.value ? max : natural;
}

async function syncHeight() {
  if (!showPanel.value) {
    panelHeight.value = 0;
    return;
  }
  paintedHits.value = hits.value.slice();
  paintedEmpty.value = showEmpty.value;
  if (!renderPanel.value) {
    renderPanel.value = true;
    panelHeight.value = 0;
    await nextTick();
    shellEl.value?.getBoundingClientRect();
  }
  await nextTick();
  panelHeight.value = contentHeight();
}

watch([showPanel, hits, showEmpty], () => {
  void syncHeight();
}, { flush: "post" });

watch(showPanel, (open) => {
  emit("active", open);
});

function select(note: PublicNote) {
  cancel();
  emit("select", note);
}

defineExpose({
  cancel,
  isActive: () => showPanel.value,
});

function onShellTransitionEnd(event: TransitionEvent) {
  if (event.propertyName !== "height") return;
  if (!showPanel.value) renderPanel.value = false;
}

function onResize() {
  if (showPanel.value) panelHeight.value = contentHeight();
}

onMounted(() => window.addEventListener("resize", onResize));
onUnmounted(() => window.removeEventListener("resize", onResize));
</script>

<template>
  <div class="search-overlay" ref="overlayEl">
    <div class="search-bar" ref="barEl">
      <input
        id="note-search"
        type="search"
        autocomplete="off"
        spellcheck="false"
        placeholder="Search notes"
        aria-label="Search notes"
        v-model="query"
      />
      <label class="search-distance">
        <span>{{ milesLabel }}</span>
        <input
          type="range"
          min="0.1"
          max="3"
          step="0.1"
          v-model.number="miles"
          @pointerdown="adjusting = true"
          @pointerup="adjusting = false"
          @pointercancel="adjusting = false"
          @focus="adjusting = true"
          @blur="adjusting = false"
        />
      </label>
    </div>
    <div
      ref="shellEl"
      class="search-results-shell"
      :class="{ 'is-open': showPanel, 'is-clipped': clipped }"
      :style="{ height: `${panelHeight}px` }"
      @transitionend="onShellTransitionEnd"
    >
      <div v-if="renderPanel" ref="panelEl" class="search-results">
        <p class="search-empty" v-if="paintedEmpty">No matching notes in range.</p>
        <div class="search-grid" v-else>
          <div
            v-for="note in paintedHits"
            :key="note.post"
            class="post-composer-card search-hit"
            :style="{ '--note-tint': accentFor(note.post) }"
            role="button"
            tabindex="0"
            @click="select(note)"
            @keydown.enter="select(note)"
          >
            <NoteBookmark :post="note.post" @sign-in="emit('signIn')" />
            <p class="note-reader-body">{{ note.body }}</p>
            <div class="note-reader-meta">
              <p class="note-reader-author" :title="note.username ?? ''">{{ note.username ?? "" }}</p>
              <NoteVotes :note="note" @click.stop @keydown.enter.stop @sign-in="emit('signIn')" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
