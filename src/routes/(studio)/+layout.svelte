<script lang="ts">
  import { afterNavigate, pushState, replaceState } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import { readAuthenticationActionModel } from "$lib/application/auth/action-data";
  import type { AuthenticationPanelModel } from "$lib/application/auth/types";
  import { normalizeAuthUrl, readAuthView, withAuthView } from "$lib/application/shell/auth-dialog-state";
  import type { AuthDialogView } from "$lib/application/shell/types";
  import { readRailCollapsed, writeRailCollapsed } from "$lib/client/shell/rail-preference";

  import { createAuthenticationPanelController } from "./(authentication)/controller.svelte";
  import { createStudioShellController, readyAuthenticationModel } from "./controller.svelte";
  import Screen from "./screen.svelte";

  import { onMount, untrack } from "svelte";

  let { children, data } = $props();

  let currentHref = $state(page.url.href);
  const initialRoute = untrack(() => ({
    href: currentHref,
    activeNavigation: data.activeNavigation === "home" ? ("home" as const) : null,
    session: data.session,
  }));
  const initialAuthView = readAuthView(new URL(initialRoute.href).searchParams);
  const authentication = createAuthenticationPanelController({
    model: authenticationModel(initialAuthView ?? "login"),
    action: authenticationAction(initialAuthView ?? "login"),
  });
  const controller = createStudioShellController({
    model: {
      activeNavigation: initialRoute.activeNavigation,
      authView: initialAuthView,
      drawerOpen: false,
      rail: "expanded",
      session: initialRoute.session,
    },
    homeHref: resolve("/"),
    accountHref: resolve("/account"),
    logoutAction: resolve("/auth/logout"),
    authentication,
    resolveAuthentication: (view) => ({
      model: authenticationModel(view),
      action: authenticationAction(view),
    }),
    onAuthViewChange: changeAuthView,
    onRailChange: (rail) => writeRailCollapsed(window.localStorage, rail === "collapsed"),
  });

  $effect(() => {
    const authView = readAuthView(new URL(currentHref).searchParams);
    const activeNavigation = data.activeNavigation === "home" ? "home" : null;
    const session = data.session;
    const routeAuthentication = authView
      ? { model: authenticationModel(authView), action: authenticationAction(authView) }
      : undefined;

    untrack(() =>
      controller.synchronizeRoute({
        activeNavigation,
        session,
        authView,
        authentication: routeAuthentication,
      })
    );
  });

  afterNavigate(() => {
    currentHref = window.location.href;
  });

  onMount(() => {
    controller.synchronizeRail(readRailCollapsed(window.localStorage) ? "collapsed" : "expanded");

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
    return readAuthenticationActionModel(page.form, view) ?? readyAuthenticationModel(view);
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
    const previousView = readAuthView(new URL(window.location.href).searchParams);
    const next = withAuthView(new URL(window.location.href), view);
    if (previousView === null && view !== null) {
      // eslint-disable-next-line svelte/no-navigation-without-resolve -- window.location is already base-resolved.
      pushState(next, page.state);
    } else {
      // eslint-disable-next-line svelte/no-navigation-without-resolve -- window.location is already base-resolved.
      replaceState(next, page.state);
    }
    currentHref = next.href;
  }
</script>

<Screen {controller}>
  {@render children()}
</Screen>
