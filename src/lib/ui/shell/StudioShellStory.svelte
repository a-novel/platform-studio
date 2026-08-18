<script module lang="ts">
  import type { StudioShellCopy, StudioShellViewModel } from "./types";

  /** Controllable Storybook harness around the pure shell. */
  export interface StudioShellStoryProps {
    copy: StudioShellCopy;
    initialModel: StudioShellViewModel;
    frameWidth?: string;
  }
</script>

<script lang="ts">
  import HomeScreen from "./HomeScreen.svelte";
  import StudioShell from "./StudioShell.svelte";

  import { untrack } from "svelte";

  let { copy, initialModel, frameWidth }: StudioShellStoryProps = $props();

  let model = $state<StudioShellViewModel>(untrack(() => structuredClone(initialModel)));

  function updateModel(patch: Partial<StudioShellViewModel>) {
    model = { ...model, ...patch };
  }
</script>

<div class="story-frame" style:--story-frame-width={frameWidth}>
  <StudioShell
    {copy}
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
    <HomeScreen title={copy.homeTitle} />

    {#snippet authContent(view)}
      <div class="auth-story-content" data-auth-view={view}>
        <span>{copy.formPlaceholder}</span>
      </div>
    {/snippet}
  </StudioShell>
</div>

<style>
  .story-frame {
    inline-size: var(--story-frame-width, 100%);
    min-block-size: 100dvb;
  }

  .auth-story-content {
    display: grid;
    place-items: center;
    border: var(--border-width-thin) dashed var(--color-border-default);
    border-radius: var(--radius-lg);
    background: var(--color-surface-sunken);
    padding: var(--space-8);
    min-block-size: var(--space-24);
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
</style>
