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
  import { createAuthenticationPanelController } from "./(authentication)/controller.svelte";
  import HomeScreen from "./(home)/screen.svelte";
  import { createStudioShellController, readyAuthenticationModel } from "./controller.svelte";
  import Screen from "./screen.svelte";

  import { untrack } from "svelte";

  let { initialModel, initialAuthenticationModel, frameWidth }: StudioShellStoryProps = $props();

  const storyModel = untrack(() => structuredClone(initialModel));
  const authentication = createAuthenticationPanelController({
    model: untrack(() =>
      structuredClone(initialAuthenticationModel ?? readyAuthenticationModel(initialModel.authView ?? "login"))
    ),
    action: "/storybook/auth",
    allowNativeSubmission: false,
  });
  const controller = createStudioShellController({
    model: storyModel,
    homeHref: "/",
    accountHref: "/storybook/account",
    logoutAction: "/storybook/logout",
    authentication,
    resolveAuthentication: (view) => ({
      model: readyAuthenticationModel(view),
      action: "/storybook/auth",
    }),
    lockAuthentication: storyModel.authView !== null,
    allowNativeLogout: false,
  });
</script>

<div class="story-frame" style:--story-frame-width={frameWidth}>
  <Screen {controller}>
    <HomeScreen />
  </Screen>
</div>

<style>
  .story-frame {
    inline-size: var(--story-frame-width, 100%);
    min-block-size: 100dvb;
  }
</style>
