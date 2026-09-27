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
  import { Link, StatusState } from "@a-novel-kit/uikit";

  let { feedback, continueHref }: AuthenticationCompletionProps = $props();
  const { t } = getI18nContext();
  const message = $derived(translateAuthenticationFeedback(t, feedback));
</script>

{#snippet continuation()}
  <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- App-resolved continuation URL. -->
  <Link href={continueHref}>{t("authUi.shortCode.continue")}</Link>
{/snippet}

<StatusState
  tone="success"
  title={continueHref ? message : t("authUi.authentication.successTitle")}
  description={continueHref ? undefined : message}
  actions={continueHref ? continuation : undefined}
/>
