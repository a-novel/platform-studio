<script lang="ts">
  import { translateShortCodeTitle } from "$lib/i18n/auth-copy";

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
  <title>{translateShortCodeTitle(t, controller.state.model)} — {t("authUi.shortCode.brand")}</title>
</svelte:head>

<Screen {controller} />
