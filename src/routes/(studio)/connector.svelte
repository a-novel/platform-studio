<script module lang="ts">
  import type { ShellSession, StudioShellViewModel } from "$lib/application/shell/types";

  import type { Snippet } from "svelte";

  /** Live SvelteKit wiring around the pure Studio shell. */
  export interface ConnectorProps {
    activeNavigation: StudioShellViewModel["activeNavigation"];
    session: ShellSession;
    children?: Snippet;
  }
</script>

<script lang="ts">
  import { afterNavigate, pushState, replaceState } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import { readAuthenticationActionModel } from "$lib/application/auth/action-data";
  import type { AuthenticationPanelModel } from "$lib/application/auth/types";
  import { normalizeAuthUrl, readAuthView, withAuthView } from "$lib/application/shell/auth-dialog-state";
  import type { AuthDialogView } from "$lib/application/shell/types";
  import { readRailCollapsed, writeRailCollapsed } from "$lib/client/shell/rail-preference";

  import AuthenticationPanel from "./(authentication)/screen.svelte";
  import Screen from "./screen.svelte";

  import { onMount } from "svelte";

  let { activeNavigation, session, children }: ConnectorProps = $props();

  let drawerOpen = $state(false);
  let logoutForm: HTMLFormElement;
  let rail = $state<StudioShellViewModel["rail"]>("expanded");
  let submittingView = $state<AuthDialogView | null>(null);

  let currentHref = $state(page.url.href);
  const authView = $derived(readAuthView(new URL(currentHref).searchParams));
  const model = $derived<StudioShellViewModel>({
    activeNavigation,
    authView,
    drawerOpen,
    rail,
    session,
  });

  afterNavigate(() => {
    currentHref = window.location.href;
    submittingView = null;
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

  function authenticationModel(view: AuthDialogView): AuthenticationPanelModel {
    if (submittingView === view) {
      return { journey: view, state: { status: "submitting" } } as AuthenticationPanelModel;
    }

    return (
      readAuthenticationActionModel(page.form, view) ??
      ({ journey: view, state: { status: "ready" } } as AuthenticationPanelModel)
    );
  }

  function authenticationAction(view: AuthDialogView): string {
    const current = new URL(currentHref);
    const target = new URL(resolve("/"), current);
    target.searchParams.set("auth", view);

    const returnTo = current.searchParams.get("returnTo");
    if (returnTo) target.searchParams.set("returnTo", returnTo);

    return target.pathname + target.search;
  }

  function changeAuthView(view: AuthDialogView | null) {
    submittingView = null;
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

  function logout() {
    logoutForm.requestSubmit();
  }
</script>

{#snippet authContent(view: AuthDialogView)}
  <AuthenticationPanel
    model={authenticationModel(view)}
    action={authenticationAction(view)}
    onSubmit={() => (submittingView = view)}
  />
{/snippet}

<Screen
  {authContent}
  {model}
  accountHref={resolve("/account")}
  onAuthViewChange={changeAuthView}
  onDrawerOpenChange={(open) => (drawerOpen = open)}
  onLogout={logout}
  onToggleRail={toggleRail}
>
  {@render children?.()}
</Screen>

<form bind:this={logoutForm} method="POST" action={resolve("/auth/logout")} hidden></form>
