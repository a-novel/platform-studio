<script module lang="ts">
  import type { StudioShellCopy, StudioShellViewModel } from "./types";

  import type { Snippet } from "svelte";

  /** SvelteKit wiring around the pure Studio shell. */
  export interface StudioShellControllerProps {
    activeNavigation: StudioShellViewModel["activeNavigation"];
    copy: StudioShellCopy;
    children?: Snippet;
  }
</script>

<script lang="ts">
  import { afterNavigate, pushState, replaceState } from "$app/navigation";
  import { page } from "$app/state";

  import StudioShell from "./StudioShell.svelte";
  import { normalizeAuthUrl, readAuthView, readRailCollapsed, withAuthView, writeRailCollapsed } from "./state";
  import type { AuthDialogView } from "./types";

  import { onMount } from "svelte";

  let { activeNavigation, copy, children }: StudioShellControllerProps = $props();

  let drawerOpen = $state(false);
  let rail = $state<StudioShellViewModel["rail"]>("expanded");

  let currentHref = $state(page.url.href);
  const authView = $derived(readAuthView(new URL(currentHref).searchParams));
  const model = $derived<StudioShellViewModel>({
    activeNavigation,
    authView,
    drawerOpen,
    rail,
    session: { status: "anonymous" },
  });

  afterNavigate(() => {
    currentHref = window.location.href;
  });

  onMount(() => {
    rail = readRailCollapsed(window.localStorage) ? "collapsed" : "expanded";

    function synchronizeUrl() {
      const normalized = normalizeAuthUrl(new URL(window.location.href));
      if (normalized.href !== window.location.href) {
        // eslint-disable-next-line svelte/no-navigation-without-resolve -- window.location is already base-resolved.
        replaceState(normalized, page.state);
      }
      currentHref = normalized.href;
    }

    synchronizeUrl();
    window.addEventListener("popstate", synchronizeUrl);

    return () => window.removeEventListener("popstate", synchronizeUrl);
  });

  function changeAuthView(view: AuthDialogView | null) {
    const next = withAuthView(new URL(window.location.href), view);
    if (authView === null && view !== null) {
      // eslint-disable-next-line svelte/no-navigation-without-resolve -- window.location is already base-resolved.
      pushState(next, page.state);
    } else {
      // eslint-disable-next-line svelte/no-navigation-without-resolve -- window.location is already base-resolved.
      replaceState(next, page.state);
    }
    currentHref = next.href;
  }

  function toggleRail() {
    const railCollapsed = rail === "expanded";
    rail = railCollapsed ? "collapsed" : "expanded";
    writeRailCollapsed(window.localStorage, railCollapsed);
  }
</script>

<StudioShell
  {copy}
  {model}
  onAuthViewChange={changeAuthView}
  onDrawerOpenChange={(open) => (drawerOpen = open)}
  onToggleRail={toggleRail}
>
  {@render children?.()}
</StudioShell>
