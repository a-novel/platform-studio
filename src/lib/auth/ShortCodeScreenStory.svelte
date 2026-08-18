<script module lang="ts">
  import type { AuthUiCopy } from "./copy";
  import type { ShortCodeScreenModel } from "./types";

  /** Controllable Storybook harness around the pure secure-link screen. */
  export interface ShortCodeScreenStoryProps {
    copy: AuthUiCopy["shortCode"];
    initialModel: ShortCodeScreenModel;
    frameWidth?: string;
  }
</script>

<script lang="ts">
  import ShortCodeScreen from "./ShortCodeScreen.svelte";

  import { untrack } from "svelte";

  let { copy, initialModel, frameWidth }: ShortCodeScreenStoryProps = $props();

  let model = $state<ShortCodeScreenModel>(untrack(() => structuredClone(initialModel)));

  function submit(event: SubmitEvent) {
    event.preventDefault();
    if (model.state.status === "submitting") return;
    model = { ...model, state: { status: "submitting" } };
  }
</script>

<div class="story-frame" style:--story-frame-width={frameWidth}>
  <ShortCodeScreen
    {copy}
    {model}
    action="/storybook/complete"
    homeHref="/"
    restartHref="/?auth=reset"
    continueHref="/"
    onSubmit={submit}
  />
</div>

<style>
  .story-frame {
    inline-size: var(--story-frame-width, 100%);
    min-block-size: 100dvb;
  }
</style>
