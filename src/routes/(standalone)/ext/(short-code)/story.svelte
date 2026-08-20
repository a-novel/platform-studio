<script module lang="ts">
  import type { ShortCodeScreenModel } from "$lib/application/auth/types";

  /** Controllable Storybook harness around the pure secure-link screen. */
  export interface ShortCodeScreenStoryProps {
    initialModel: ShortCodeScreenModel;
    frameWidth?: string;
  }
</script>

<script lang="ts">
  import ShortCodeScreen from "./screen.svelte";

  import { untrack } from "svelte";

  let { initialModel, frameWidth }: ShortCodeScreenStoryProps = $props();

  let model = $state<ShortCodeScreenModel>(untrack(() => structuredClone(initialModel)));

  function submit(event: SubmitEvent) {
    event.preventDefault();
    if (model.state.status === "submitting") return;
    model = { ...model, state: { status: "submitting" } };
  }
</script>

<div class="story-frame" style:--story-frame-width={frameWidth}>
  <ShortCodeScreen {model} action="/storybook/complete" restartHref="/?auth=reset" continueHref="/" onSubmit={submit} />
</div>

<style>
  .story-frame {
    inline-size: var(--story-frame-width, 100%);
    min-block-size: 100dvb;
  }
</style>
