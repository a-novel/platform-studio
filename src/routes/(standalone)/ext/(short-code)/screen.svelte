<script module lang="ts">
  import type { FormIssue, ShortCodePasswordField } from "$lib/application/auth/types";

  import type { ShortCodeScreenController } from "./controller.svelte";

  /** Props for a pure standalone email-link completion screen. */
  export interface ShortCodeScreenProps {
    controller: ShortCodeScreenController;
  }
</script>

<script lang="ts">
  import { translateShortCodeJourney, translateShortCodeStatus } from "$lib/i18n/auth-copy";
  import { translateAuthenticationFeedback, translateAuthenticationValidation } from "$lib/i18n/auth-feedback";

  import { getI18nContext } from "@a-novel-kit/nodelib-i18n/svelte";
  import { Alert, Button, Field, Input, Link } from "@a-novel-kit/uikit";

  let { controller }: ShortCodeScreenProps = $props();

  const model = $derived(controller.state.model);
  const action = $derived(controller.state.action);
  const restartHref = $derived(controller.state.restartHref);
  const continueHref = $derived(controller.state.continueHref);

  const { t } = getI18nContext();
  const componentId = $props.id();
  const newPasswordId = `${componentId}-new-password`;
  const confirmPasswordId = `${componentId}-confirm-password`;
  const submitting = $derived(model.state.status === "submitting");
  const issues = $derived(model.state.status === "validation-error" ? model.state.issues : []);
  const journeyTitle = $derived(translateShortCodeJourney(t, model.journey, "title"));
  const journeyDescription = $derived(translateShortCodeJourney(t, model.journey, "description"));
  const journeySubmit = $derived(translateShortCodeJourney(t, model.journey, "submit"));
  const journeySubmitting = $derived(translateShortCodeJourney(t, model.journey, "submitting"));
  const unavailableStatus = $derived(
    model.state.status === "missing" || model.state.status === "invalid" || model.state.status === "expired"
      ? model.state.status
      : null
  );

  function issueMessage(
    currentIssues: readonly FormIssue<ShortCodePasswordField>[],
    field: ShortCodePasswordField
  ): string | undefined {
    const issue = currentIssues.find((candidate) => candidate.field === field);
    return issue ? translateAuthenticationValidation(t, issue.feedback) : undefined;
  }

  function submit(event: SubmitEvent) {
    if (!controller.submit()) event.preventDefault();
  }
</script>

<main class="standalone-page">
  <section class="secure-action" aria-labelledby={`${componentId}-title`}>
    <header class="page-heading">
      <h1 id={`${componentId}-title`}>{journeyTitle}</h1>
      {#if !unavailableStatus && model.state.status !== "success"}<p>{journeyDescription}</p>{/if}
    </header>

    {#if unavailableStatus}
      <Alert tone="error" title={translateShortCodeStatus(t, unavailableStatus, "title")}>
        <div class="status-copy">
          <p>{translateShortCodeStatus(t, unavailableStatus, "description")}</p>
          <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- The pure screen receives app-resolved URLs. -->
          <Link href={restartHref}>{t("authUi.shortCode.restart")}</Link>
        </div>
      </Alert>
    {:else if model.state.status === "success"}
      <div class="status-copy successful-action" role="status">
        <p>{translateAuthenticationFeedback(t, model.state.feedback)}</p>
        <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- The pure screen receives app-resolved URLs. -->
        <Link href={continueHref}>{t("authUi.shortCode.continue")}</Link>
      </div>
    {:else}
      <form method="POST" {action} aria-busy={submitting} onsubmit={submit}>
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
          <Alert
            class="compact-form-error"
            tone="error"
            title={translateAuthenticationFeedback(t, model.state.feedback)}
          />
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
    display: grid;
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
    align-self: center;
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
    margin-block-start: var(--space-2);
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
