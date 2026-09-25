<script lang="ts">
  import { createShortCodeScreenController, shortCodeControllerState } from "../../controller.svelte";
  import Screen from "../../screen.svelte";

  import { untrack } from "svelte";

  import { getI18nContext } from "@a-novel-kit/nodelib-i18n/svelte";

  let { data, form } = $props();
  const { t } = getI18nContext();
  const controller = createShortCodeScreenController(untrack(() => shortCodeControllerState(data, form)));

  $effect(() => {
    const state = shortCodeControllerState(data, form);
    untrack(() => controller.synchronize(state));
  });
</script>

<svelte:head>
  <title>{t("authUi.shortCode.journeys.emailUpdate.title")} — {t("authUi.shortCode.brand")}</title>
</svelte:head>

<Screen {controller} />
