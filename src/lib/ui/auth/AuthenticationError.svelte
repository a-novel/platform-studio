<!-- @component Shared form-level feedback; field validation stays with the corresponding input. -->
<script lang="ts">
  import type { AuthenticationFeedback } from "$lib/application/auth/types";
  import { translateAuthenticationFeedback } from "$lib/i18n/auth-feedback";

  import { getI18nContext } from "@a-novel-kit/nodelib-i18n/svelte";
  import { Alert } from "@a-novel-kit/uikit";

  let { feedback }: { feedback: AuthenticationFeedback } = $props();
  const { t } = getI18nContext();
</script>

{#if feedback === "serviceUnavailable"}
  <Alert tone="error" title={t("authUi.serviceUnavailable")}>
    {translateAuthenticationFeedback(t, feedback)}
  </Alert>
{:else}
  <Alert tone="error" title={translateAuthenticationFeedback(t, feedback)} />
{/if}
