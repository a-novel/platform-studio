<script lang="ts">
  import { signInHref } from "#lib/application/auth/navigation.js";
  import { errorPageTitle } from "#lib/i18n/page-titles.js";
  import PageTitle from "#lib/ui/PageTitle.svelte";
  import { getStudioDowntime } from "#lib/ui/downtime.svelte.js";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";

  import Screen from "./(studio)/(access)/failure.svelte";

  import { getI18nContext } from "@a-novel-kit/nodelib-i18n/svelte";

  const { t } = getI18nContext();
  const studioDowntime = getStudioDowntime();
  const downtime = $derived(
    page.error?.downtime && studioDowntime.downtime
      ? { end: studioDowntime.downtime.end, timeZone: studioDowntime.timeZone }
      : undefined
  );
  const currentPath = $derived(page.url.pathname + page.url.search);
</script>

<PageTitle title={errorPageTitle(t, page.status, downtime !== undefined)} />

<Screen
  status={page.status}
  signInHref={signInHref(currentPath)}
  homeHref={resolve("")}
  retryHref={currentPath}
  {downtime}
/>
