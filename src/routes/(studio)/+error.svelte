<script lang="ts">
  import { loginHref } from "#lib/application/auth/navigation.js";
  import { errorPageTitle } from "#lib/i18n/page-titles.js";
  import PageTitle from "#lib/ui/PageTitle.svelte";
  import { getStudioDowntime } from "#lib/ui/downtime.svelte.js";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";

  import Screen from "./(access)/failure.svelte";

  import { getI18nContext } from "@a-novel-kit/nodelib-i18n/svelte";

  const { t } = getI18nContext();
  const studioDowntime = getStudioDowntime();
  const downtime = $derived(
    page.error?.downtime && studioDowntime.downtime
      ? { end: studioDowntime.downtime.end, timeZone: studioDowntime.timeZone }
      : undefined
  );
</script>

<PageTitle title={errorPageTitle(t, page.status, downtime !== undefined)} />

<Screen
  status={page.status}
  loginHref={loginHref(page.url.pathname + page.url.search)}
  homeHref={resolve("")}
  retryHref={page.url.pathname + page.url.search}
  {downtime}
/>
