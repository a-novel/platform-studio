<script lang="ts">
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import { loginHref } from "$lib/application/auth/navigation";

  import Screen from "./(access)/failure.svelte";

  import { getI18nContext } from "@a-novel-kit/nodelib-i18n/svelte";

  const { t } = getI18nContext();
</script>

<svelte:head>
  <title>{page.status} — {t("shell.brand")}</title>
</svelte:head>

<Screen
  status={page.status}
  loginHref={loginHref(page.url.pathname + page.url.search)}
  homeHref={resolve("/")}
  retryHref={page.url.pathname + page.url.search}
/>
