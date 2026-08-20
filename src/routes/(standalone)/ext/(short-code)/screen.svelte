<script module lang="ts">
  import type { FormIssue, ShortCodePasswordField, ShortCodeScreenModel } from "$lib/application/auth/types";

  /** Props for a pure standalone email-link completion screen. */
  export interface ShortCodeScreenProps {
    model: ShortCodeScreenModel;
    action: string;
    restartHref: string;
    continueHref: string;
    onSubmit?: (event: SubmitEvent) => void;
  }
</script>

<script lang="ts">
  import type { ShortCodeJourney } from "$lib/application/auth/types";

  import { getI18nContext } from "@a-novel-kit/nodelib-i18n/svelte";
  import { Alert, Button, Field, Input, Link } from "@a-novel-kit/uikit";

  let { model, action, restartHref, continueHref, onSubmit }: ShortCodeScreenProps = $props();

  const { t } = getI18nContext();
  const componentId = $props.id();
  const newPasswordId = `${componentId}-new-password`;
  const confirmPasswordId = `${componentId}-confirm-password`;
  const submitting = $derived(model.state.status === "submitting");
  const issues = $derived(model.state.status === "validation-error" ? model.state.issues : []);
  const journeyTitle = $derived(getJourneyTitle(model.journey));
  const journeyDescription = $derived(getJourneyDescription(model.journey));
  const journeySubmit = $derived(getJourneySubmit(model.journey));
  const journeySubmitting = $derived(getJourneySubmitting(model.journey));
  const unavailableStatus = $derived(
    model.state.status === "missing" || model.state.status === "invalid" || model.state.status === "expired"
      ? model.state.status
      : null
  );

  function issueMessage(
    currentIssues: readonly FormIssue<ShortCodePasswordField>[],
    field: ShortCodePasswordField
  ): string | undefined {
    return currentIssues.find((issue) => issue.field === field)?.message;
  }

  function getJourneyTitle(journey: ShortCodeJourney): string {
    switch (journey) {
      case "email-update":
        return t("authUi.shortCode.journeys.emailUpdate.title");
      case "password-reset":
        return t("authUi.shortCode.journeys.passwordReset.title");
      case "register":
      default:
        return t("authUi.shortCode.journeys.register.title");
    }
  }

  function getJourneyDescription(journey: ShortCodeJourney): string {
    switch (journey) {
      case "email-update":
        return t("authUi.shortCode.journeys.emailUpdate.description");
      case "password-reset":
        return t("authUi.shortCode.journeys.passwordReset.description");
      case "register":
      default:
        return t("authUi.shortCode.journeys.register.description");
    }
  }

  function getJourneySubmit(journey: ShortCodeJourney): string {
    switch (journey) {
      case "email-update":
        return t("authUi.shortCode.journeys.emailUpdate.submit");
      case "password-reset":
        return t("authUi.shortCode.journeys.passwordReset.submit");
      case "register":
      default:
        return t("authUi.shortCode.journeys.register.submit");
    }
  }

  function getJourneySubmitting(journey: ShortCodeJourney): string {
    switch (journey) {
      case "email-update":
        return t("authUi.shortCode.journeys.emailUpdate.submitting");
      case "password-reset":
        return t("authUi.shortCode.journeys.passwordReset.submitting");
      case "register":
      default:
        return t("authUi.shortCode.journeys.register.submitting");
    }
  }

  function getUnavailableTitle(status: "missing" | "invalid" | "expired"): string {
    switch (status) {
      case "invalid":
        return t("authUi.shortCode.states.invalid.title");
      case "expired":
        return t("authUi.shortCode.states.expired.title");
      case "missing":
      default:
        return t("authUi.shortCode.states.missing.title");
    }
  }

  function getUnavailableDescription(status: "missing" | "invalid" | "expired"): string {
    switch (status) {
      case "invalid":
        return t("authUi.shortCode.states.invalid.description");
      case "expired":
        return t("authUi.shortCode.states.expired.description");
      case "missing":
      default:
        return t("authUi.shortCode.states.missing.description");
    }
  }
</script>

<main class="standalone-page">
  <section class="secure-action" aria-labelledby={`${componentId}-title`}>
    <header class="page-heading">
      <h1 id={`${componentId}-title`}>{journeyTitle}</h1>
      {#if !unavailableStatus && model.state.status !== "success"}<p>{journeyDescription}</p>{/if}
    </header>

    {#if unavailableStatus}
      <Alert tone="error" title={getUnavailableTitle(unavailableStatus)}>
        <div class="status-copy">
          <p>{getUnavailableDescription(unavailableStatus)}</p>
          <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- The pure screen receives app-resolved URLs. -->
          <Link href={restartHref}>{t("authUi.shortCode.restart")}</Link>
        </div>
      </Alert>
    {:else if model.state.status === "success"}
      <div class="status-copy successful-action" role="status">
        <p>{model.state.message}</p>
        <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- The pure screen receives app-resolved URLs. -->
        <Link href={continueHref}>{t("authUi.shortCode.continue")}</Link>
      </div>
    {:else}
      <form method="POST" {action} aria-busy={submitting} onsubmit={onSubmit}>
        {#if model.journey !== "email-update"}
          <Field
            controlId={newPasswordId}
            label={t("authUi.shortCode.newPasswordLabel")}
            error={issueMessage(issues, "newPassword")}
            required
          >
            {#snippet children(control)}
              <Input
                {...control}
                name="password"
                type="password"
                autocomplete="new-password"
                disabled={submitting}
                invalid={Boolean(issueMessage(issues, "newPassword"))}
              />
            {/snippet}
          </Field>
          <Field
            controlId={confirmPasswordId}
            label={t("authUi.shortCode.confirmPasswordLabel")}
            error={issueMessage(issues, "confirmPassword")}
            required
          >
            {#snippet children(control)}
              <Input
                {...control}
                name="confirmPassword"
                type="password"
                autocomplete="new-password"
                disabled={submitting}
                invalid={Boolean(issueMessage(issues, "confirmPassword"))}
              />
            {/snippet}
          </Field>
        {/if}

        {#if model.state.status === "service-error"}
          <Alert class="compact-form-error" tone="error" title={model.state.message} />
        {/if}

        <Button type="submit" disabled={submitting}>
          {submitting ? journeySubmitting : journeySubmit}
        </Button>
      </form>
    {/if}
  </section>
</main>

<style>
  .standalone-page {
    box-sizing: border-box;
    background: var(--color-surface-canvas);
    padding: clamp(var(--space-4), 5vi, var(--space-12));
    min-block-size: 100dvb;
    color: var(--color-text-primary);
  }

  .secure-action,
  form,
  .status-copy {
    display: grid;
    gap: var(--space-4);
    min-inline-size: 0;
  }

  .secure-action {
    margin-inline: auto;
    max-inline-size: var(--layout-readable-measure);
  }

  .page-heading {
    display: grid;
    gap: var(--space-2);
  }

  .page-heading h1,
  .page-heading p,
  .status-copy p {
    margin: 0;
  }

  .page-heading h1 {
    font-size: var(--font-size-2xl);
    line-height: var(--line-height-tight);
    font-family: var(--font-family-display);
  }

  .page-heading p,
  .status-copy p {
    line-height: var(--line-height-normal);
  }

  .page-heading p {
    color: var(--color-text-muted);
  }

  form > :global(button) {
    justify-content: center;
    inline-size: 100%;
  }

  .successful-action p {
    color: var(--color-feedback-success-text);
    font-weight: var(--font-weight-bold);
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
