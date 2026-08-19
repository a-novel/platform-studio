<script lang="ts">
  import StudioShellController from "$lib/client/shell/StudioShellController.svelte";

  import "@a-novel-kit/uikit-fonts/fonts.css";
  import "@a-novel-kit/uikit-tokens/tokens.css";

  let { children, data } = $props();
</script>

<StudioShellController copy={data.shellCopy} activeNavigation={data.activeNavigation === "home" ? "home" : null}>
  {@render children()}
</StudioShellController>

<style>
  :global(html) {
    background: var(--color-surface-canvas);
    min-inline-size: 20rem;
    color-scheme: dark;
  }

  :global(body) {
    margin: 0;
    min-block-size: 100dvb;
  }
</style>
