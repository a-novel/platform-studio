<script lang="ts">
  import HomeScreen from "$lib/ui/shell/HomeScreen.svelte";

  import { getI18nContext } from "@a-novel-kit/nodelib-i18n/svelte";

  const { t } = getI18nContext();
</script>

<svelte:head>
  <title>{t("shell.homeTitle")} — {t("shell.brand")}</title>
</svelte:head>

<HomeScreen />
