<script lang="ts">
  import { applyAction, deserialize } from "$app/forms";
  import { goto } from "$app/navigation";
  import { translateShortCodeTitle } from "$lib/i18n/auth-copy";

  import { createShortCodeScreenController, shortCodeControllerState } from "../../controller.svelte";
  import Screen from "../../screen.svelte";

  import { onMount, untrack } from "svelte";

  import { getI18nContext } from "@a-novel-kit/nodelib-i18n/svelte";

  let { data, form } = $props();
  const { t } = getI18nContext();
  const controller = createShortCodeScreenController(untrack(() => shortCodeControllerState(data, form)));

  $effect(() => {
    const state = shortCodeControllerState(data, form);
    untrack(() => controller.synchronize(state));
  });

  onMount(() => {
    const request = new AbortController();
    void validateEmail(request.signal);
    return () => request.abort();
  });

  async function validateEmail(signal: AbortSignal) {
    if (controller.state.model.state.status !== "ready" || !controller.submit()) return;

    try {
      // Keep GET/prefetch read-only; only the mounted route consumes the link through its action.
      const response = await fetch("", {
        method: "POST",
        headers: { accept: "application/json", "x-sveltekit-action": "true" },
        body: new FormData(),
        signal,
      });
      const result = deserialize(await response.text());
      if (signal.aborted) return;
      if (result.type === "redirect") {
        // eslint-disable-next-line svelte/no-navigation-without-resolve -- The server action supplies an app-resolved URL.
        await goto(result.location, { replaceState: true, invalidateAll: true });
      } else await applyAction(result);
    } catch {
      if (!signal.aborted) {
        controller.synchronize({
          ...controller.state,
          model: { journey: "email-update", state: { status: "service-error", feedback: "serviceUnavailable" } },
        });
      }
    }
  }
</script>

<svelte:head>
  <title>{translateShortCodeTitle(t, controller.state.model)} — {t("authUi.shortCode.brand")}</title>
</svelte:head>

<Screen {controller} />
