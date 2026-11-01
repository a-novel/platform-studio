<script module lang="ts">
  import type { StudioShellViewModel } from "#lib/application/shell/types.js";

  import type { Snippet } from "svelte";

  /** Fixed-state Storybook harness around the pure shell. */
  export interface StudioShellStoryProps {
    initialModel: StudioShellViewModel;
    /** Whether Studio collects browser telemetry, which adds the Privacy destination. */
    collectsTelemetry?: boolean;
    /** A started planned downtime, which the shell announces. */
    downtime?: { start: Date; end: Date };
    /** Content after the home page, such as filler to scroll past sticky elements. */
    children?: Snippet;
  }
</script>

<script lang="ts">
  import { setStudioDowntime } from "#lib/ui/downtime.svelte.js";
  import { setTelemetryPreference } from "#lib/ui/telemetry-preference.js";

  import HomeScreen from "./(home)/screen.svelte";
  import type { StudioShellController } from "./controller.svelte";
  import Screen from "./screen.svelte";

  import { untrack } from "svelte";

  let { initialModel, collectsTelemetry, downtime, children }: StudioShellStoryProps = $props();

  if (untrack(() => collectsTelemetry))
    setTelemetryPreference({ pending: false, choice: "accepted", choose: () => {} });

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
      return {
        model: initialModel,
        homeHref: "#home",
        accountHref: "#account",
        invitationHref: "#invitation",
        privacyHref: "#privacy",
        logoutAction: "#logout",
      };
    },
    navigationDialog: {
      get state() {
        return { open: initialModel.drawerOpen };
      },
      open: () => {},
      close: () => {},
      toggle: () => {},
    },
    navigationHref: (open) => (open ? "#navigation" : "#home"),
    signInHref: () => "#sign-in",
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
