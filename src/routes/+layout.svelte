<script lang="ts">
  import StudioI18nProvider from "#lib/i18n/StudioI18nProvider.svelte";
  import { createStudioDowntime, setStudioDowntime } from "#lib/ui/downtime.svelte.js";

  import "@a-novel-kit/uikit-fonts/fonts.css";
  import "@a-novel-kit/uikit-tokens/tokens.css";

  let { children, data } = $props();

  // The shell and standalone pages place the banner where it doesn't push navigation away.
  setStudioDowntime(createStudioDowntime(() => data));
</script>

<StudioI18nProvider locale={data.locale}>
  {@render children()}
</StudioI18nProvider>

<style>
  :global(html) {
    background: var(--color-surface-canvas);
    min-inline-size: 20rem;
    color-scheme: dark;
  }

  :global(body) {
    margin: 0;
    min-block-size: 100dvb;
    font-family: var(--font-family-interface);
  }
</style>
