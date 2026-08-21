<script module lang="ts">
  import type { AccountScreenModel } from "$lib/application/auth/types";

  /** Controllable Storybook harness around the pure account screen. */
  export interface AccountScreenStoryProps {
    initialModel: AccountScreenModel;
    frameWidth?: string;
  }
</script>

<script lang="ts">
  import { createAccountScreenController } from "./controller.svelte";
  import AccountScreen from "./screen.svelte";

  import { untrack } from "svelte";

  let { initialModel, frameWidth }: AccountScreenStoryProps = $props();

  const actions = {
    password: "/storybook/account/password",
    email: "/storybook/account/email",
    logout: "/storybook/account/logout",
  };
  const controller = createAccountScreenController({
    model: untrack(() => structuredClone(initialModel)),
    actions,
    allowNativeSubmission: false,
  });
</script>

<div class="story-frame" style:--story-frame-width={frameWidth}>
  <AccountScreen {controller} />
</div>

<style>
  .story-frame {
    background: var(--color-surface-canvas);
    inline-size: var(--story-frame-width, 100%);
    min-block-size: 100dvb;
  }
</style>
