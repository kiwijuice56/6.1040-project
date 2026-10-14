export type AppView = "find" | "notes" | "settings";

const VIEWS = ["find", "notes", "settings"] as const;

function viewFromHash(): AppView {
  const id = window.location.hash.replace(/^#/, "");
  if (id === "profile") return "settings";
  return (VIEWS as readonly string[]).includes(id) ? (id as AppView) : "find";
}

export function bindNav(options: { onView: (view: AppView) => void; onSignIn: () => void }) {
  const toggle = document.querySelector<HTMLButtonElement>("#nav-menu")!;
  const nav = document.querySelector<HTMLElement>("#primary-nav")!;
  const account = document.querySelector<HTMLAnchorElement>("#nav-account")!;
  const accountLabel = document.querySelector<HTMLElement>("#nav-account-label")!;
  const iconSignIn = document.querySelector<HTMLElement>("#nav-icon-signin")!;
  const iconProfile = document.querySelector<HTMLElement>("#nav-icon-profile")!;
  const compact = window.matchMedia("(max-width: 44rem)");
  let open = false;
  let signedIn = false;
  let current: AppView | undefined;

  function viewLinks() {
    return [...nav.querySelectorAll<HTMLAnchorElement>("a[data-view]")];
  }

  function setOpen(value: boolean) {
    open = value;
    toggle.setAttribute("aria-expanded", String(open));
    syncLayout();
  }

  function syncLayout() {
    const small = compact.matches;
    toggle.hidden = !small;
    if (!small) {
      open = false;
      toggle.setAttribute("aria-expanded", "false");
      nav.hidden = false;
      return;
    }
    nav.hidden = !open;
  }

  function markCurrent(view: AppView) {
    for (const link of viewLinks()) {
      if (link.dataset.view === view) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    }
    if (signedIn && view === "settings") account.setAttribute("aria-current", "page");
    else account.removeAttribute("aria-current");
  }

  function show(view: AppView) {
    markCurrent(view);
    document.getElementById("map")!.hidden = view !== "find";
    document.getElementById("view-notes")!.hidden = view !== "notes";
    document.getElementById("view-settings")!.hidden = view !== "settings";
    document.body.dataset.view = view;
    if (compact.matches) setOpen(false);
    if (current === view) return;
    current = view;
    options.onView(view);
  }

  function setSignedIn(value: boolean) {
    signedIn = value;
    accountLabel.textContent = value ? "My profile" : "Sign in";
    iconSignIn.hidden = value;
    iconProfile.hidden = !value;
    if (value) {
      account.href = "#profile";
      account.dataset.view = "settings";
      account.removeAttribute("role");
    } else {
      account.href = "#";
      delete account.dataset.view;
      account.setAttribute("role", "button");
      if (current === "settings") {
        history.replaceState(null, "", `${location.pathname}${location.search}`);
        show("find");
      }
    }
    if (current) markCurrent(current);
  }

  account.addEventListener("click", (event) => {
    if (signedIn) return;
    event.preventDefault();
    if (compact.matches) setOpen(false);
    options.onSignIn();
  });
  toggle.addEventListener("click", () => setOpen(!open));
  window.addEventListener("hashchange", () => show(viewFromHash()));
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !open) return;
    setOpen(false);
    toggle.focus();
  });
  document.addEventListener("click", (event) => {
    if (!open || !compact.matches) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (nav.contains(target) || toggle.contains(target)) return;
    setOpen(false);
  });
  compact.addEventListener("change", syncLayout);

  setSignedIn(false);
  syncLayout();
  show(viewFromHash());

  return { setSignedIn };
}
