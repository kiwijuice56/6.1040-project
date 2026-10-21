import { computed, ref } from "vue";
import { api } from "../client.ts";
import type { PublicNote } from "../types.ts";
import { useSession } from "./useSession.ts";

const saved = ref<PublicNote[]>([]);
const loading = ref(false);

/** Shared with map popups (nested Vue apps). The signed-in person's username label. */
export function useSaves() {
  const { signedIn } = useSession();
  const ids = computed(() => new Set(saved.value.map((note) => note.post)));

  async function refresh() {
    if (!signedIn.value) {
      saved.value = [];
      return;
    }
    const result = await api["/saves/list"]();
    if ("error" in result) {
      saved.value = [];
      return;
    }
    saved.value = result.notes;
  }

  async function poll() {
    if (loading.value) return;
    loading.value = true;
    try {
      await refresh();
    } finally {
      loading.value = false;
    }
  }

  async function save(post: PublicNote["post"]) {
    if (!signedIn.value) return "Sign in to save notes.";
    const result = await api["/saves/save"]({ post });
    if (!("error" in result) || result.error === "CONFLICT") {
      await refresh();
      return;
    }
    if (result.error === "UNAUTHORIZED") return "Sign in to save notes.";
    return "Something went wrong. Try again.";
  }

  async function unsave(post: PublicNote["post"]) {
    if (!signedIn.value) return "Sign in to save notes.";
    const result = await api["/saves/unsave"]({ post });
    if (!("error" in result) || result.error === "NOT_FOUND") {
      await refresh();
      return;
    }
    if (result.error === "UNAUTHORIZED") return "Sign in to save notes.";
    return "Something went wrong. Try again.";
  }

  function isSaved(post: PublicNote["post"]) {
    return ids.value.has(post);
  }

  return { saved, loading, ids, refresh, poll, save, unsave, isSaved };
}
