<script lang="ts">
  import { getStudioDowntime } from "#lib/ui/downtime.svelte.js";

  import { DowntimeBanner } from "@a-novel-kit/uikit";

  let { children } = $props();

  const studioDowntime = getStudioDowntime();
</script>

{#if studioDowntime.downtime}
  <DowntimeBanner
    start={studioDowntime.downtime.start}
    end={studioDowntime.downtime.end}
    started={studioDowntime.started}
    timeZone={studioDowntime.timeZone}
  />
{/if}
{@render children()}
