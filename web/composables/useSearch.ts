import { onUnmounted, ref, watch, type Ref } from "vue";
import type { SearchContext } from "../../src/concepts/Querying/Querying.ts";
import { TOKEN_FUZZY } from "../../src/concepts/Querying/tokenFuzzy.ts";
import { api } from "../client.ts";
import type { MapCoordinate } from "../map.ts";
import type { PublicNote } from "../types.ts";

const RESULT_COUNT = 32;
const DEBOUNCE_MS = 180;

export function useSearch(options: {
  posts: Ref<PublicNote[]>;
  getCenter: () => MapCoordinate | undefined;
}) {
  const query = ref("");
  const miles = ref(1);
  const hits = ref<PublicNote[]>([]);
  const pending = ref(false);
  const searched = ref(false);
  let context: SearchContext | undefined;
  let timer: number | undefined;
  let generation = 0;

  async function closeContext() {
    const id = context;
    context = undefined;
    if (id) await api["/search/close"]({ context: id });
  }

  async function cover(center: MapCoordinate) {
    if (!context) {
      const opened = await api["/search/open"]({ location: center, miles: miles.value });
      if ("error" in opened) return false;
      context = opened.context;
      const replaced = await api["/search/replace"]({ context, members: opened.members });
      return !("error" in replaced);
    }
    const synced = await api["/search/sync"]({ context, location: center, miles: miles.value });
    if ("error" in synced) return false;
    const replaced = await api["/search/replace"]({ context, members: synced.members });
    return !("error" in replaced);
  }

  async function rank(text: string) {
    if (!context) return;
    const ranked = await api["/search/query"]({
      context,
      query: text,
      resultCount: RESULT_COUNT,
      algorithm: TOKEN_FUZZY,
    });
    if ("error" in ranked) return;
    return ranked.notes;
  }

  async function run(reload: boolean) {
    const mine = ++generation;
    const text = query.value.trim();
    if (!text) {
      searched.value = false;
      hits.value = [];
      pending.value = false;
      await closeContext();
      return;
    }
    const center = options.getCenter();
    if (!center) return;
    pending.value = true;
    try {
      if (reload || !context) {
        const ok = await cover(center);
        if (!ok || mine !== generation) return;
      }
      const notes = await rank(text);
      if (notes === undefined || mine !== generation) return;
      hits.value = notes;
      searched.value = true;
    } finally {
      if (mine === generation) pending.value = false;
    }
  }

  function schedule(reload: boolean) {
    if (timer !== undefined) window.clearTimeout(timer);
    timer = undefined;
    if (!query.value.trim()) {
      void run(reload);
      return;
    }
    timer = window.setTimeout(() => void run(reload), DEBOUNCE_MS);
  }

  function cancel() {
    if (timer !== undefined) window.clearTimeout(timer);
    timer = undefined;
    generation += 1;
    query.value = "";
    searched.value = false;
    hits.value = [];
    pending.value = false;
    void closeContext();
  }

  watch(query, () => schedule(false));
  watch(miles, () => {
    if (query.value.trim()) schedule(true);
  });
  watch(
    () => options.posts.value,
    () => {
      if (query.value.trim()) schedule(true);
    },
  );

  onUnmounted(() => {
    if (timer !== undefined) window.clearTimeout(timer);
    generation += 1;
    void closeContext();
  });

  return { query, miles, hits, pending, searched, cancel };
}
