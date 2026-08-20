<script module lang="ts">
  import type { StudioShellViewModel } from "$lib/application/shell/types";

  /** Controllable Storybook harness around the pure shell. */
  export interface StudioShellStoryProps {
    initialModel: StudioShellViewModel;
    frameWidth?: string;
  }
</script>

<script lang="ts">
  import HomeScreen from "./HomeScreen.svelte";
  import StudioShell from "./StudioShell.svelte";

  import { untrack } from "svelte";

  let { initialModel, frameWidth }: StudioShellStoryProps = $props();

  let model = $state<StudioShellViewModel>(untrack(() => structuredClone(initialModel)));

  function updateModel(patch: Partial<StudioShellViewModel>) {
    model = { ...model, ...patch };
  }
</script>

<div class="story-frame" style:--story-frame-width={frameWidth}>
  <StudioShell
    {model}
    onAuthViewChange={(authView) => updateModel({ authView })}
    onDrawerOpenChange={(drawerOpen) => updateModel({ drawerOpen })}
    onLogout={() => updateModel({ session: { status: "anonymous" } })}
    onManageAccount={() => undefined}
    onRetrySession={() => updateModel({ session: { status: "loading" } })}
    onToggleRail={() =>
      updateModel({
        rail: model.rail === "expanded" ? "collapsed" : "expanded",
      })}
  >
    <HomeScreen />
  </StudioShell>
</div>

<style>
  .story-frame {
    inline-size: var(--story-frame-width, 100%);
    min-block-size: 100dvb;
  }
</style>
