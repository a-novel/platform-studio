<script module lang="ts">
  import type { AuthenticationPanelModel } from "#lib/application/auth/types.js";
  import type { StudioShellViewModel } from "#lib/application/shell/types.js";

  import type { Snippet } from "svelte";

  /** Fixed-state Storybook harness around the pure shell. */
  export interface StudioShellStoryProps {
    initialModel: StudioShellViewModel;
    initialAuthenticationModel?: AuthenticationPanelModel;
    /** A started planned downtime, which the shell announces and locks the sign-in dialog for. */
    downtime?: { start: Date; end: Date };
    /** Content after the home page, such as filler to scroll past sticky elements. */
    children?: Snippet;
  }
</script>

<script lang="ts">
  import { setStudioDowntime } from "#lib/ui/downtime.svelte.js";

  import HomeScreen from "./(home)/screen.svelte";
  import { type StudioShellController, readyAuthenticationModel } from "./controller.svelte";
  import Screen from "./screen.svelte";

  import { untrack } from "svelte";

  let { initialModel, initialAuthenticationModel, downtime, children }: StudioShellStoryProps = $props();

  const startedDowntime = untrack(() => downtime);
  if (startedDowntime) {
    setStudioDowntime({
      downtime: { components: ["service-authentication.database"], ...startedDowntime },
      started: true,
      timeZone: "UTC",
    });
  }

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
    authenticationHref: (view) => `#${view ?? "home"}`,
    navigationHref: (open) => (open ? "#navigation" : "#home"),
    toggleRail: () => {},
    logout: () => false,
    synchronizeRoute: () => {},
    synchronizeRail: () => {},
  };
</script>

<div class="story-frame">
  <Screen {controller}>
    <HomeScreen />
    {@render children?.()}
  </Screen>
</div>

<style>
  .story-frame {
    inline-size: 100%;
    min-block-size: 100dvb;
  }
</style>
