<script module lang="ts">
  import type { StudioShellViewModel } from "./controller.svelte";

  import type { Snippet } from "svelte";

  /** Fixed-state Storybook harness around the pure shell. */
  export interface StudioShellStoryProps {
    model: StudioShellViewModel;
    /** Whether Studio collects browser telemetry, which adds the Privacy destination. */
    collectsTelemetry?: boolean;
    /** Whether the server could read where the account platform lives, which its links need. */
    accountLinks?: boolean;
    /** A planned downtime, which the shell announces. */
    downtime?: { start: Date; end: Date };
    /** Whether that downtime has started. */
    started?: boolean;
    /** Content after the home page, such as filler to scroll past sticky elements. */
    children?: Snippet;
  }
</script>

<script lang="ts">
  import type { StudioShellController } from "./controller.svelte";
  import Screen from "./screen.svelte";

  import { getI18nContext } from "@a-novel-kit/nodelib-i18n/svelte";

  let {
    model,
    collectsTelemetry,
    accountLinks = true,
    downtime,
    started = true,
    children,
  }: StudioShellStoryProps = $props();
  const { t } = getI18nContext();

  const controller: StudioShellController = {
    get state() {
      return {
        model,
        homeHref: "#home",
        accountHref: accountLinks ? "#account" : null,
        invitationHref: accountLinks ? "#invitation" : null,
        privacyHref: collectsTelemetry ? "#privacy" : null,
        logoutAction: "#logout",
        studioDowntime: downtime && {
          downtime: { components: ["service-authentication.database"], ...downtime },
          started,
          timeZone: "UTC",
        },
      };
    },
    navigationDialog: {
      get state() {
        return { open: model.drawerOpen };
      },
      open: () => {},
      close: () => {},
      toggle: () => {},
    },
    navigationHref: (open) => (open ? "#navigation" : "#home"),
    signInHref: () => "#sign-in",
    toggleRail: () => {},
    logout: () => false,
  };
</script>

<div class="story-frame">
  <Screen {controller}>
    <!-- A page's heading, as every Studio page has one inside the shell. -->
    <h1 class="page-heading">{t("shell.projects")}</h1>
    {@render children?.()}
  </Screen>
</div>

<style>
  .page-heading {
    position: absolute;
    clip-path: inset(50%);
    margin: 0;
    inline-size: var(--border-width-thin);
    block-size: var(--border-width-thin);
    overflow: hidden;
    white-space: nowrap;
  }

  .story-frame {
    inline-size: 100%;
    min-block-size: 100dvb;
  }
</style>
