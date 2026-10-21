import { computed, onMounted, onUnmounted, ref } from "vue";

export type AppView = "find" | "notes" | "settings" | "signin" | "signup";

const VIEWS = ["find", "notes", "settings", "signin", "signup"] as const;
const COMPACT = "(max-width: 44rem)";

export function viewFromHash(): AppView {
  const id = window.location.hash.replace(/^#/, "");
  if (id === "profile") return "settings";
  return (VIEWS as readonly string[]).includes(id) ? (id as AppView) : "find";
}

/** Hash views (`#find`, `#notes`, `#profile`, `#signin`, `#signup`) and the compact pancake menu. */
export function useView() {
  const view = ref<AppView>(typeof window === "undefined" ? "find" : viewFromHash());
  const compact = ref(false);
  const menuOpen = ref(false);

  const showMap = computed(() => view.value === "find");
  const showNotes = computed(() => view.value === "notes");
  const showProfile = computed(() => view.value === "settings");
  const showSignIn = computed(() => view.value === "signin");
  const showSignUp = computed(() => view.value === "signup");

  function setView(next: AppView) {
    view.value = next;
    if (compact.value) menuOpen.value = false;
  }

  function goFind() {
    history.replaceState(null, "", `${location.pathname}${location.search}`);
    setView("find");
  }

  let mq: MediaQueryList | undefined;
  let syncCompact: (() => void) | undefined;
  let onHash: (() => void) | undefined;

  onMounted(() => {
    mq = window.matchMedia(COMPACT);
    syncCompact = () => {
      compact.value = mq!.matches;
      if (!mq!.matches) menuOpen.value = false;
    };
    onHash = () => setView(viewFromHash());
    syncCompact();
    setView(viewFromHash());
    mq.addEventListener("change", syncCompact);
    window.addEventListener("hashchange", onHash);
  });

  onUnmounted(() => {
    if (mq && syncCompact) mq.removeEventListener("change", syncCompact);
    if (onHash) window.removeEventListener("hashchange", onHash);
  });

  return {
    view,
    compact,
    menuOpen,
    showMap,
    showNotes,
    showProfile,
    showSignIn,
    showSignUp,
    goFind,
  };
}
