<script module lang="ts">
  import type { AuthUiCopy } from "$lib/application/auth/copy";
  import type { AccountScreenModel, ReadyAccountScreenModel } from "$lib/application/auth/types";

  /** Controllable Storybook harness around the pure account screen. */
  export interface AccountScreenStoryProps {
    copy: AuthUiCopy["account"];
    initialModel: AccountScreenModel;
    frameWidth?: string;
  }
</script>

<script lang="ts">
  import AccountScreen from "./AccountScreen.svelte";

  import { untrack } from "svelte";

  let { copy, initialModel, frameWidth }: AccountScreenStoryProps = $props();

  let model = $state<AccountScreenModel>(untrack(() => structuredClone(initialModel)));

  const actions = {
    password: "/storybook/account/password",
    email: "/storybook/account/email",
    logout: "/storybook/account/logout",
  };

  function updateReady(patch: Partial<ReadyAccountScreenModel>) {
    if (model.status === "ready") model = { ...model, ...patch };
  }

  function retry() {
    model = { status: "loading" };
  }

  function submitPassword(event: SubmitEvent) {
    event.preventDefault();
    if (model.status !== "ready" || model.passwordState.status === "submitting") return;
    updateReady({ passwordState: { status: "submitting" } });
  }

  function submitEmail(event: SubmitEvent) {
    event.preventDefault();
    if (model.status !== "ready" || model.emailState.status === "submitting") return;
    updateReady({ emailState: { status: "submitting" } });
  }

  function submitLogout(event: SubmitEvent) {
    event.preventDefault();
    if (model.status !== "ready" || model.logoutState === "submitting") return;
    updateReady({ logoutState: "submitting" });
  }
</script>

<div class="story-frame" style:--story-frame-width={frameWidth}>
  <AccountScreen
    {copy}
    {model}
    {actions}
    onRetry={retry}
    onPasswordSubmit={submitPassword}
    onEmailSubmit={submitEmail}
    onLogoutSubmit={submitLogout}
  />
</div>

<style>
  .story-frame {
    background: var(--color-surface-canvas);
    inline-size: var(--story-frame-width, 100%);
    min-block-size: 100dvb;
  }
</style>
