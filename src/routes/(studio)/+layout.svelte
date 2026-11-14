<script lang="ts">
  import { relayApi } from "#lib/client/projects/api.js";
  import { createProjectsSync, setProjectsSync } from "#lib/client/projects/sync.svelte.js";
  import { retryWhile } from "#lib/client/retry.svelte.js";
  import { getStudioDowntime } from "#lib/ui/downtime.svelte.js";
  import { hasTelemetryPreference } from "#lib/ui/telemetry-preference.js";
  import { PUBLIC_PLATFORM_DOMAIN } from "$app/env/public";
  import { afterNavigate, goto, invalidate } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";

  import { createStudioShellController } from "./controller.svelte";
  import { shellSessionData } from "./dependencies";
  import { withNavigationOpen } from "./navigation-state";
  import Screen from "./screen.svelte";

  import { onMount } from "svelte";

  import { saveNavigationRail } from "@a-novel-kit/nodelib-browser/preferences";
  import { AuthorizationProvider } from "@a-novel-kit/uikit";
  import { createAuthorizationController } from "@a-novel-kit/uikit/authorization";

  let { children, data } = $props();
  const authorization = createAuthorizationController({
    getStatus: () => page.data.authorization ?? data.authorization,
  });

  let currentHref = $state(page.url.href);
  const controller = createStudioShellController({
    getData: () => data,
    homeHref: resolve("projects"),
    // Only a Studio that collects browser telemetry asks for consent, so only it offers to change the answer.
    privacyHref: hasTelemetryPreference() ? resolve("privacy") : null,
    logoutAction: resolve("auth/logout"),
    studioDowntime: getStudioDowntime(),
    getUrl: () => new URL(currentHref),
    onDrawerChange: (open) => showShallow(withNavigationOpen(new URL(window.location.href), open)),
    // Every Agora app under the shared domain opens with the rail the visitor left.
    onRailChange: (rail) => saveNavigationRail(rail, { domain: PUBLIC_PLATFORM_DOMAIN }),
  });

  // The account's projects sync for the whole app, so a soft navigation keeps their schedule.
  setProjectsSync(
    createProjectsSync(
      () => data.session,
      relayApi,
      () => invalidate(shellSessionData)
    )
  );

  retryWhile(
    () => data.session.status === "loading",
    () => invalidate(shellSessionData)
  );

  afterNavigate(async ({ complete, shallow }) => {
    if (shallow) return;

    // History updates require the router to finish initial hydration.
    await complete;
    synchronizeUrl();
  });

  onMount(() => {
    window.addEventListener("popstate", synchronizeUrl);

    return () => window.removeEventListener("popstate", synchronizeUrl);
  });

  /** Shows a URL change without loading the page, and makes it the shell's current URL. */
  function showShallow(next: URL) {
    // eslint-disable-next-line svelte/no-navigation-without-resolve -- Shallow routing edits the current, resolved URL.
    goto(next, { shallow: true, replace: true, state: page.state });
    currentHref = next.href;
  }

  function synchronizeUrl() {
    currentHref = window.location.href;
  }
</script>

<AuthorizationProvider controller={authorization}>
  <Screen {controller}>
    {@render children()}
  </Screen>
</AuthorizationProvider>
