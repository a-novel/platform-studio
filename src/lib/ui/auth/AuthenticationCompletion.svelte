<script module lang="ts">
  import type { AuthenticationFeedback } from "$lib/application/auth/types";

  /** Completion feedback for authentication dialogs and standalone secure links. */
  export interface AuthenticationCompletionProps {
    feedback: AuthenticationFeedback;
    /** App-resolved continuation URL for standalone completion pages. */
    continueHref?: string;
  }
</script>

<script lang="ts">
  import { translateAuthenticationFeedback } from "$lib/i18n/auth-feedback";

  import { getI18nContext } from "@a-novel-kit/nodelib-i18n/svelte";
  import { Link, Stack } from "@a-novel-kit/uikit";

  import { CircleCheck } from "@lucide/svelte";

  let { feedback, continueHref }: AuthenticationCompletionProps = $props();
  const { t } = getI18nContext();
  const message = $derived(translateAuthenticationFeedback(t, feedback));
</script>

<Stack gap="3" align="center" role="status">
  <div class="success-mark" aria-hidden="true">
    <CircleCheck size="var(--icon-size-lg)" />
  </div>
  <h2>{continueHref ? message : t("authUi.authentication.successTitle")}</h2>
  {#if continueHref}
    <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- App-resolved continuation URL. -->
    <Link href={continueHref}>{t("authUi.shortCode.continue")}</Link>
  {:else}
    <p>{message}</p>
  {/if}
</Stack>

<style>
  .success-mark {
    display: grid;
    place-items: center;
    border-radius: var(--radius-round);
    background: var(--color-feedback-success-surface);
    inline-size: var(--space-12);
    block-size: var(--space-12);
    color: var(--color-feedback-success-text);
  }

  h2,
  p {
    margin: 0;
    text-align: center;
  }

  h2 {
    color: var(--color-text-primary);
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-lg);
    line-height: var(--line-height-tight);
  }

  p {
    color: var(--color-text-secondary);
    line-height: var(--line-height-normal);
  }
</style>
