<script module lang="ts">
  import type { AuthenticationPanelModel } from "$lib/application/auth/types";
  import type { StudioShellViewModel } from "$lib/application/shell/types";

  /** Controllable Storybook harness around the pure shell. */
  export interface StudioShellStoryProps {
    initialModel: StudioShellViewModel;
    initialAuthenticationModel?: AuthenticationPanelModel;
    frameWidth?: string;
  }
</script>

<script lang="ts">
  import type { AuthDialogView } from "$lib/application/shell/types";

  import AuthenticationPanel from "./(authentication)/screen.svelte";
  import HomeScreen from "./(home)/screen.svelte";
  import Screen from "./screen.svelte";

  import { untrack } from "svelte";

  let { initialModel, initialAuthenticationModel, frameWidth }: StudioShellStoryProps = $props();

  let model = $state<StudioShellViewModel>(untrack(() => structuredClone(initialModel)));
  let panelModel = $state<AuthenticationPanelModel>(
    untrack(() => structuredClone(initialAuthenticationModel ?? readyModel(initialModel.authView ?? "login")))
  );

  function updateModel(patch: Partial<StudioShellViewModel>) {
    model = { ...model, ...patch };
  }

  function readyModel(view: AuthDialogView): AuthenticationPanelModel {
    return { journey: view, state: { status: "ready" } };
  }

  function changeAuthView(view: AuthDialogView | null) {
    updateModel({ authView: view });
    if (view) panelModel = readyModel(view);
  }

  function submit(event: SubmitEvent) {
    event.preventDefault();
    panelModel = { journey: panelModel.journey, state: { status: "submitting" } } as AuthenticationPanelModel;
  }
</script>

{#snippet authContent()}
  <AuthenticationPanel model={panelModel} action="/storybook/auth" onSubmit={submit} />
{/snippet}

<div class="story-frame" style:--story-frame-width={frameWidth}>
  <Screen
    {authContent}
    {model}
    accountHref="/storybook/account"
    onAuthViewChange={changeAuthView}
    onDrawerOpenChange={(drawerOpen) => updateModel({ drawerOpen })}
    onLogout={() => updateModel({ session: { status: "anonymous" } })}
    onToggleRail={() =>
      updateModel({
        rail: model.rail === "expanded" ? "collapsed" : "expanded",
      })}
  >
    <HomeScreen />
  </Screen>
</div>

<style>
  .story-frame {
    inline-size: var(--story-frame-width, 100%);
    min-block-size: 100dvb;
  }
</style>
