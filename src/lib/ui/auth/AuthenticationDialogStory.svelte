<script module lang="ts">
  import type { AuthenticationJourney, AuthenticationPanelModel } from "$lib/application/auth/types";

  /** Controllable Storybook composition of auth UI inside the real shell dialog. */
  export interface AuthenticationDialogStoryProps {
    initialModel: AuthenticationPanelModel;
    frameWidth?: string;
  }
</script>

<script lang="ts">
  import type { AuthDialogView, StudioShellViewModel } from "$lib/application/shell/types";
  import HomeScreen from "$lib/ui/shell/HomeScreen.svelte";
  import StudioShell from "$lib/ui/shell/StudioShell.svelte";

  import AuthenticationPanel from "./AuthenticationPanel.svelte";

  import { untrack } from "svelte";

  let { initialModel, frameWidth }: AuthenticationDialogStoryProps = $props();

  let panelModel = $state<AuthenticationPanelModel>(untrack(() => structuredClone(initialModel)));
  let authView = $state<AuthDialogView | null>(untrack(() => journeyToView(initialModel.journey)));

  const shellModel = $derived<StudioShellViewModel>({
    activeNavigation: "home",
    authView,
    drawerOpen: false,
    rail: "expanded",
    session: { status: "anonymous" },
  });

  function journeyToView(journey: AuthenticationJourney): AuthDialogView {
    if (journey === "register") return "register";
    if (journey === "reset") return "reset";
    return "login";
  }

  function readyModel(view: AuthDialogView): AuthenticationPanelModel {
    if (view === "register") return { journey: "register", state: { status: "ready" } };
    if (view === "reset") return { journey: "reset", state: { status: "ready" } };
    return { journey: "login", state: { status: "ready" } };
  }

  function changeAuthView(view: AuthDialogView | null) {
    authView = view;
    if (view) panelModel = readyModel(view);
  }

  function submit(event: SubmitEvent) {
    event.preventDefault();
    if (panelModel.state.status === "submitting") return;

    if (panelModel.journey === "login") {
      panelModel = { journey: "login", state: { status: "submitting" } };
    } else {
      panelModel = { journey: panelModel.journey, state: { status: "submitting" } };
    }
  }
</script>

<div class="story-frame" style:--story-frame-width={frameWidth}>
  <StudioShell model={shellModel} onAuthViewChange={changeAuthView}>
    <HomeScreen />

    {#snippet authContent()}
      <AuthenticationPanel model={panelModel} action="/storybook/auth" onSubmit={submit} />
    {/snippet}
  </StudioShell>
</div>

<style>
  .story-frame {
    inline-size: var(--story-frame-width, 100%);
    min-block-size: 100dvb;
  }
</style>
