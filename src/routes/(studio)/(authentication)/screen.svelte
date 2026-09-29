<script module lang="ts">
  import type { AuthenticationPanelController } from "./controller.svelte";

  /** Props for the pure form rendered inside the shell authentication dialog. */
  export interface AuthenticationPanelProps {
    controller: AuthenticationPanelController;
  }
</script>

<script lang="ts">
  import type { AuthenticationField } from "$lib/application/auth/types";
  import { translateAuthenticationJourney } from "$lib/i18n/auth-copy";
  import { translateAuthenticationFeedback, translateAuthenticationValidation } from "$lib/i18n/auth-feedback";
  import AuthenticationCompletion from "$lib/ui/auth/AuthenticationCompletion.svelte";

  import { getI18nContext } from "@a-novel-kit/nodelib-i18n/svelte";
  import { Alert, Button, Field, FormActions, Input, StatusState } from "@a-novel-kit/uikit";

  let { controller }: AuthenticationPanelProps = $props();

  const model = $derived(controller.state.model);
  const action = $derived(controller.state.action);

  const { t } = getI18nContext();
  const componentId = $props.id();
  const emailId = `${componentId}-email`;
  const passwordId = `${componentId}-password`;
  const submitting = $derived(model.state.status === "submitting");
  const issues = $derived(model.state.status === "validation-error" ? model.state.issues : []);
  const submitLabel = $derived(translateAuthenticationJourney(t, model.journey, "submit"));
  const submittingLabel = $derived(translateAuthenticationJourney(t, model.journey, "submitting"));
  const pendingDescription = $derived(translateAuthenticationJourney(t, model.journey, "pendingDescription"));

  function fieldError(field: AuthenticationField): string | undefined {
    const issue = issues.find((candidate) => candidate.field === field);
    return issue ? translateAuthenticationValidation(t, issue.feedback) : undefined;
  }

  function submit(event: SubmitEvent) {
    if (!controller.submit()) event.preventDefault();
  }
</script>

{#if model.state.status === "pending-email"}
  {@const targetHint = model.state.targetHint}
  <StatusState tone="success" title={t("authUi.authentication.pendingTitle")}>
    {#snippet description()}
      {pendingDescription} <strong class="pending-target">{targetHint}</strong>
    {/snippet}
  </StatusState>
{:else if model.state.status === "success"}
  <AuthenticationCompletion feedback={model.state.feedback} />
{:else}
  <form method="POST" {action} aria-busy={submitting} onsubmit={submit}>
    <Field controlId={emailId} label={t("authUi.authentication.emailLabel")} error={fieldError("email")} required>
      {#snippet children(control)}
        <Input
          {...control}
          name="email"
          type="email"
          autocomplete={model.journey === "login" ? "username" : "email"}
          autocapitalize="none"
          spellcheck="false"
          disabled={submitting}
          invalid={Boolean(fieldError("email"))}
        />
      {/snippet}
    </Field>

    {#if model.journey === "login"}
      <Field
        controlId={passwordId}
        label={t("authUi.authentication.passwordLabel")}
        error={fieldError("password")}
        required
      >
        {#snippet children(control)}
          <Input
            {...control}
            name="password"
            type="password"
            autocomplete="current-password"
            disabled={submitting}
            invalid={Boolean(fieldError("password"))}
          />
        {/snippet}
      </Field>
    {/if}

    <FormActions>
      {#snippet feedback()}
        {#if model.state.status === "service-error"}
          <Alert tone="error" title={translateAuthenticationFeedback(t, model.state.feedback)} />
        {/if}
      {/snippet}
      <Button type="submit" disabled={submitting}>
        {submitting ? submittingLabel : submitLabel}
      </Button>
    </FormActions>
  </form>
{/if}

<style>
  form {
    display: grid;
    gap: var(--space-4);
    min-inline-size: 0;
  }

  .pending-target {
    color: var(--color-text-primary);
    overflow-wrap: anywhere;
  }
</style>
