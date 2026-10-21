import { ref } from "vue";
import { api } from "../client.ts";
import type { PublicNote, VoteChoice } from "../types.ts";
import { useSaves } from "./useSaves.ts";

const posts = ref<PublicNote[]>([]);
const loading = ref(false);

/** Shared with map popups (nested Vue apps). Filled by `/posts/list`; mutations refetch. */
export function usePosts() {
  const { refresh: refreshSaves } = useSaves();

  async function refresh() {
    const result = await api["/posts/list"]();
    if ("error" in result) return;
    posts.value = result.posts;
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

  async function create(input: { body: string; location: PublicNote["location"] }) {
    const result = await api["/posts/create"](input);
    if (!("error" in result)) {
      await refresh();
      await refreshSaves();
      return;
    }
    if (result.error === "UNAUTHORIZED") return "Sign in to post.";
    if (result.error === "INVALID_REQUEST") return "That note couldn't be posted.";
    return "Something went wrong. Try again.";
  }

  async function edit(input: { post: PublicNote["post"]; body: string }) {
    const result = await api["/posts/edit"](input);
    if (!("error" in result)) {
      await refresh();
      await refreshSaves();
      return;
    }
    if (result.error === "UNAUTHORIZED") return "Sign in to edit.";
    if (result.error === "FORBIDDEN") return "Only the author can change this post.";
    if (result.error === "NOT_FOUND") return "That note is gone.";
    if (result.error === "INVALID_REQUEST") return "A post needs some text.";
    return "Something went wrong. Try again.";
  }

  async function remove(input: { post: PublicNote["post"] }) {
    const result = await api["/posts/delete"](input);
    if (!("error" in result)) {
      await refresh();
      await refreshSaves();
      return;
    }
    if (result.error === "UNAUTHORIZED") return "Sign in to delete.";
    if (result.error === "FORBIDDEN") return "Only the author can change this post.";
    if (result.error === "NOT_FOUND") return "That note is gone.";
    return "Something went wrong. Try again.";
  }

  async function vote(input: { post: PublicNote["post"]; action: "upvote" | "downvote" | "unvote" }) {
    const result =
      input.action === "upvote"
        ? await api["/posts/upvote"]({ post: input.post })
        : input.action === "downvote"
          ? await api["/posts/downvote"]({ post: input.post })
          : await api["/posts/unvote"]({ post: input.post });
    if (!("error" in result)) {
      await refresh();
      return;
    }
    if (result.error === "UNAUTHORIZED") return "Sign in to vote.";
    if (result.error === "CONFLICT") return "You already have a vote on this.";
    if (result.error === "NOT_FOUND") return "You have not voted on this.";
    return "Something went wrong. Try again.";
  }

  async function mine(input: { post: PublicNote["post"] }): Promise<VoteChoice | undefined> {
    const result = await api["/posts/vote"]({ post: input.post });
    if ("error" in result) return;
    if ("upvote" in result && typeof result.upvote === "boolean") return result.upvote ? "up" : "down";
  }

  return { posts, loading, refresh, poll, create, edit, remove, vote, mine };
}
