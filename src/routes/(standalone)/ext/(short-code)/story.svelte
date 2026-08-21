<script module lang="ts">
  import type { ShortCodeScreenModel } from "$lib/application/auth/types";

  /** Controllable Storybook harness around the pure secure-link screen. */
  export interface ShortCodeScreenStoryProps {
    initialModel: ShortCodeScreenModel;
    frameWidth?: string;
  }
</script>

<script lang="ts">
  import { createShortCodeScreenController } from "./controller.svelte";
  import ShortCodeScreen from "./screen.svelte";

  import { untrack } from "svelte";

  let { initialModel, frameWidth }: ShortCodeScreenStoryProps = $props();

  const controller = createShortCodeScreenController({
    model: untrack(() => structuredClone(initialModel)),
    action: "/storybook/complete",
    restartHref: "/?auth=reset",
    continueHref: "/",
    allowNativeSubmission: false,
  });
</script>

<div class="story-frame" style:--story-frame-width={frameWidth}>
  <ShortCodeScreen {controller} />
</div>

<style>
  .story-frame {
    inline-size: var(--story-frame-width, 100%);
    min-block-size: 100dvb;
  }
</style>
