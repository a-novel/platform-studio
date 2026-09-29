<script lang="ts">
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import { loginHref } from "$lib/application/auth/navigation";
  import { errorPageTitle } from "$lib/i18n/page-titles";
  import PageTitle from "$lib/ui/PageTitle.svelte";

  import Screen from "./(studio)/(access)/failure.svelte";

  import { getI18nContext } from "@a-novel-kit/nodelib-i18n/svelte";

  const { t } = getI18nContext();
</script>

<PageTitle title={errorPageTitle(t, page.status)} />

<Screen
  status={page.status}
  loginHref={loginHref(page.url.pathname + page.url.search)}
  homeHref={resolve("/")}
  retryHref={page.url.pathname + page.url.search}
/>
