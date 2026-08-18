<script module lang="ts">
  import type { StudioShellCopy } from "../shell/types";
  import type { AuthUiCopy } from "./copy";
  import type { AuthenticationJourney, AuthenticationPanelModel } from "./types";

  /** Controllable Storybook composition of auth UI inside the real shell dialog. */
  export interface AuthenticationDialogStoryProps {
    authCopy: AuthUiCopy["authentication"];
    shellCopy: StudioShellCopy;
    initialModel: AuthenticationPanelModel;
    frameWidth?: string;
  }
</script>

<script lang="ts">
  import HomeScreen from "../shell/HomeScreen.svelte";
  import StudioShell from "../shell/StudioShell.svelte";
  import type { AuthDialogView, StudioShellViewModel } from "../shell/types";
  import AuthenticationPanel from "./AuthenticationPanel.svelte";

  import { untrack } from "svelte";

  let { authCopy, shellCopy, initialModel, frameWidth }: AuthenticationDialogStoryProps = $props();

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
  <StudioShell copy={shellCopy} model={shellModel} onAuthViewChange={changeAuthView}>
    <HomeScreen title={shellCopy.homeTitle} />

    {#snippet authContent()}
      <AuthenticationPanel copy={authCopy} model={panelModel} action="/storybook/auth" onSubmit={submit} />
    {/snippet}
  </StudioShell>
</div>

<style>
  .story-frame {
    inline-size: var(--story-frame-width, 100%);
    min-block-size: 100dvb;
  }
</style>
