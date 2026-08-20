<script lang="ts">
  import Connector from "./connector.svelte";

  import { getI18nContext } from "@a-novel-kit/nodelib-i18n/svelte";

  let { data, form } = $props();
  const { t } = getI18nContext();
</script>

<svelte:head>
  <title>{t("authUi.account.title")} — {t("shell.brand")}</title>
</svelte:head>

<Connector {data} {form} />
