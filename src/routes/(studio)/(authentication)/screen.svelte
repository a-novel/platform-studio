<script module lang="ts">
  import type { AuthenticationPanelModel } from "$lib/application/auth/types";

  /** Props for the pure form rendered inside the shell authentication dialog. */
  export interface AuthenticationPanelProps {
    model: AuthenticationPanelModel;
    action: string;
    onSubmit?: (event: SubmitEvent) => void;
  }
</script>

<script lang="ts">
  import type { AuthenticationField, AuthenticationJourney } from "$lib/application/auth/types";

  import { getI18nContext } from "@a-novel-kit/nodelib-i18n/svelte";
  import { Alert, Button, ErrorSummary, Field, Input, Spinner } from "@a-novel-kit/uikit";

  import { CircleCheck, Mail } from "@lucide/svelte";

  let { model, action, onSubmit }: AuthenticationPanelProps = $props();

  const { t } = getI18nContext();
  const componentId = $props.id();
  const emailId = `${componentId}-email`;
  const passwordId = `${componentId}-password`;
  const submitting = $derived(model.state.status === "submitting");
  const issues = $derived(model.state.status === "validation-error" ? model.state.issues : []);
  const summaryErrors = $derived(
    issues.map((issue, index) => ({
      id: `${issue.field}-${index}`,
      href: `#${issue.field === "email" ? emailId : passwordId}`,
      message: issue.message,
    }))
  );
  const submitLabel = $derived(getSubmitLabel(model.journey));
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
    return issues.find((issue) => issue.field === field)?.message;
  }
</script>

{#snippet mailIcon()}<Mail size="var(--icon-size-md)" />{/snippet}
{#snippet successIcon()}<CircleCheck size="var(--icon-size-md)" />{/snippet}

{#if model.state.status === "pending-email"}
  <Alert tone="success" title={t("authUi.authentication.pendingTitle")} icon={mailIcon}>
    <div class="feedback-copy">
      <p>{pendingDescription}</p>
      <dl>
        <dt>{t("authUi.authentication.pendingTargetLabel")}</dt>
        <dd>{model.state.targetHint}</dd>
      </dl>
      <p>{t("authUi.authentication.pendingPrivacy")}</p>
    </div>
  </Alert>
{:else if model.state.status === "success"}
  <Alert tone="success" title={t("authUi.authentication.successTitle")} icon={successIcon}>
    <p class="feedback-message">{model.state.message}</p>
  </Alert>
{:else}
  <form method="POST" {action} aria-busy={submitting} onsubmit={onSubmit}>
    {#if model.state.status === "validation-error"}
      <ErrorSummary
        title={t("authUi.authentication.validationTitle")}
        description={t("authUi.authentication.validationDescription")}
        errors={summaryErrors}
        headingLevel={3}
        focusOnMount
      />
    {:else if model.state.status === "service-error"}
      <Alert tone="error" title={t("authUi.authentication.serviceErrorTitle")}>
        <p class="feedback-message">{model.state.message}</p>
      </Alert>
    {/if}

    <Field
      controlId={emailId}
      label={t("authUi.authentication.emailLabel")}
      hint={t("authUi.authentication.emailHint")}
      error={fieldError("email")}
      required
    >
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

    <Button type="submit" disabled={submitting}>
      {#if submitting}
        <Spinner label={t("authUi.authentication.submitting")} size="sm" />
        <span aria-hidden="true">{t("authUi.authentication.submitting")}</span>
      {:else}
        {submitLabel}
      {/if}
    </Button>
  </form>
{/if}

<style>
  form,
  .feedback-copy {
    display: grid;
    gap: var(--space-4);
    min-inline-size: 0;
  }

  form > :global(button) {
    justify-content: center;
    inline-size: 100%;
  }

  .feedback-copy p,
  .feedback-message,
  dl {
    margin: 0;
  }

  .feedback-copy p,
  .feedback-message {
    line-height: var(--line-height-normal);
  }

  dl {
    display: grid;
    gap: var(--space-1);
    border-radius: var(--radius-md);
    background: var(--color-surface-island-subtle);
    padding: var(--space-3);
  }

  dt {
    color: var(--color-text-muted);
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-xs);
    text-transform: uppercase;
  }

  dd {
    margin: 0;
    color: var(--color-text-primary);
    font-family: var(--font-family-mono);
    overflow-wrap: anywhere;
  }
</style>
