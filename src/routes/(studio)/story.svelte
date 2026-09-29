<script module lang="ts">
  import type { AuthenticationPanelModel } from "$lib/application/auth/types";
  import type { StudioShellViewModel } from "$lib/application/shell/types";

  /** Fixed-state Storybook harness around the pure shell. */
  export interface StudioShellStoryProps {
    initialModel: StudioShellViewModel;
    initialAuthenticationModel?: AuthenticationPanelModel;
  }
</script>

<script lang="ts">
  import HomeScreen from "./(home)/screen.svelte";
  import { type StudioShellController, readyAuthenticationModel } from "./controller.svelte";
  import Screen from "./screen.svelte";

  let { initialModel, initialAuthenticationModel }: StudioShellStoryProps = $props();

  const controller: StudioShellController = {
    get state() {
      return { model: initialModel, homeHref: "#home", accountHref: "#account", logoutAction: "#logout" };
    },
    authentication: {
      get state() {
        return {
          model: initialAuthenticationModel ?? readyAuthenticationModel(initialModel.authView ?? "login"),
          action: "#auth",
        };
      },
      synchronize: () => {},
      submit: () => false,
    },
    navigationDialog: {
      get state() {
        return { open: initialModel.drawerOpen };
      },
      open: () => {},
      close: () => {},
      toggle: () => {},
    },
    authenticationDialog: {
      get state() {
        return { open: initialModel.authView !== null };
      },
      open: () => {},
      close: () => {},
      toggle: () => {},
    },
    openAuthentication: () => {},
    toggleRail: () => {},
    logout: () => false,
    synchronizeRoute: () => {},
    synchronizeRail: () => {},
  };
</script>

<div class="story-frame">
  <Screen {controller}>
    <HomeScreen />
  </Screen>
</div>

<style>
  .story-frame {
    inline-size: 100%;
    min-block-size: 100dvb;
  }
</style>
