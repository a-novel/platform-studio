<script module lang="ts">
  import type { AuthenticationFeedback } from "$lib/application/auth/types";

  /** Completion feedback for authentication dialogs. */
  export interface AuthenticationCompletionProps {
    feedback: AuthenticationFeedback;
  }
</script>

<script lang="ts">
  import { translateAuthenticationFeedback } from "$lib/i18n/auth-feedback";

  import { getI18nContext } from "@a-novel-kit/nodelib-i18n/svelte";
  import { StatusState } from "@a-novel-kit/uikit";

  let { feedback }: AuthenticationCompletionProps = $props();
  const { t } = getI18nContext();
</script>

<StatusState
  tone="success"
  title={t("authUi.authentication.successTitle")}
  description={translateAuthenticationFeedback(t, feedback)}
/>
