<script lang="ts">
  import { getStudioDowntime } from "#lib/ui/downtime.svelte.js";

  import { DowntimeBanner } from "@a-novel-kit/uikit";

  let { children } = $props();

  const studioDowntime = getStudioDowntime();
</script>

<div class="page">
  {#if studioDowntime.downtime}
    <div class="downtime">
      <DowntimeBanner
        start={studioDowntime.downtime.start}
        end={studioDowntime.downtime.end}
        started={studioDowntime.started}
        timeZone={studioDowntime.timeZone}
      />
    </div>
  {/if}
  <div class="content">{@render children()}</div>
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    min-block-size: 100dvb;
  }

  .content {
    flex: 1;
  }

  /* The maintenance banner stays above the page while it scrolls. */
  .downtime {
    position: sticky;
    z-index: var(--layer-sticky);
    inset-block-start: 0;
  }

  /* On narrow screens it waits at the bottom, away from where reading starts, and never covers the end. */
  @media (max-width: 47.999rem) {
    .downtime {
      order: 1;
      inset-block-end: 0;
      inset-block-start: auto;
    }
  }
</style>
