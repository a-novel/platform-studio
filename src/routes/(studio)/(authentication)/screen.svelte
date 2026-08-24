<script module lang="ts">
  import type { AuthenticationPanelController } from "./controller.svelte";

  /** Props for the pure form rendered inside the shell authentication dialog. */
  export interface AuthenticationPanelProps {
    controller: AuthenticationPanelController;
  }
</script>

<script lang="ts">
  import type { AuthenticationField, AuthenticationJourney } from "$lib/application/auth/types";
  import { translateAuthenticationFeedback, translateAuthenticationValidation } from "$lib/i18n/auth-feedback";

  import { getI18nContext } from "@a-novel-kit/nodelib-i18n/svelte";
  import { Alert, Button, Field, Input } from "@a-novel-kit/uikit";

  let { controller }: AuthenticationPanelProps = $props();

  const model = $derived(controller.state.model);
  const action = $derived(controller.state.action);

  const { t } = getI18nContext();
  const componentId = $props.id();
  const emailId = `${componentId}-email`;
  const passwordId = `${componentId}-password`;
  const submitting = $derived(model.state.status === "submitting");
  const issues = $derived(model.state.status === "validation-error" ? model.state.issues : []);
  const submitLabel = $derived(getSubmitLabel(model.journey));
  const submittingLabel = $derived(getSubmittingLabel(model.journey));
  const pendingDescription = $derived(getPendingDescription(model.journey));

  function getSubmitLabel(journey: AuthenticationJourney): string {
    switch (journey) {
      case "register":
        return t("authUi.authentication.journeys.register.submit");
      case "reset":
        return t("authUi.authentication.journeys.reset.submit");
      case "login":
      default:
        return t("authUi.authentication.journeys.login.submit");
    }
  }

  function getSubmittingLabel(journey: AuthenticationJourney): string {
    switch (journey) {
      case "register":
        return t("authUi.authentication.journeys.register.submitting");
      case "reset":
        return t("authUi.authentication.journeys.reset.submitting");
      case "login":
      default:
        return t("authUi.authentication.journeys.login.submitting");
    }
  }

  function getPendingDescription(journey: AuthenticationJourney): string {
    switch (journey) {
      case "register":
        return t("authUi.authentication.journeys.register.pendingDescription");
      case "reset":
      case "login":
      default:
        return t("authUi.authentication.journeys.reset.pendingDescription");
    }
  }

  function fieldError(field: AuthenticationField): string | undefined {
    const issue = issues.find((candidate) => candidate.field === field);
    return issue ? translateAuthenticationValidation(t, issue.feedback) : undefined;
  }

  function submit(event: SubmitEvent) {
    if (!controller.submit()) event.preventDefault();
  }
</script>

{#if model.state.status === "pending-email"}
  <section class="completion-state" role="status">
    <p class="completion-title">{t("authUi.authentication.pendingTitle")}</p>
    <p class="pending-copy">{pendingDescription} <strong>{model.state.targetHint}</strong></p>
  </section>
{:else if model.state.status === "success"}
  <section class="completion-state" role="status">
    <p class="completion-title">{t("authUi.authentication.successTitle")}</p>
    <p class="feedback-message">{translateAuthenticationFeedback(t, model.state.feedback)}</p>
  </section>
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

    {#if model.state.status === "service-error"}
      <Alert class="compact-form-error" tone="error" title={translateAuthenticationFeedback(t, model.state.feedback)} />
    {/if}

    <Button type="submit" disabled={submitting}>
      {submitting ? submittingLabel : submitLabel}
    </Button>
  </form>
{/if}

<style>
  form {
    display: grid;
    gap: var(--space-4);
    min-inline-size: 0;
  }

  form > :global(button) {
    justify-content: center;
    margin-block-start: var(--space-2);
    inline-size: 100%;
  }

  .completion-state {
    display: grid;
    gap: var(--space-2);
  }

  .completion-title {
    margin: 0;
    color: var(--color-feedback-success-text);
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-sm);
  }

  .pending-copy,
  .feedback-message {
    margin: 0;
    line-height: var(--line-height-normal);
  }

  .pending-copy strong {
    color: var(--color-text-primary);
    overflow-wrap: anywhere;
  }

  :global(.alert.compact-form-error.compact-form-error) {
    border-radius: var(--radius-md);
    padding: var(--space-2) var(--space-3);
  }

  :global(.compact-form-error .content) {
    gap: 0;
  }

  :global(.compact-form-error .message:empty) {
    display: none;
  }
</style>
