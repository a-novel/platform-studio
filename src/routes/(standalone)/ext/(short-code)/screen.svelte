<script module lang="ts">
  import type { FormIssue, ShortCodePasswordField } from "#lib/application/auth/types.js";

  import type { ShortCodeScreenController } from "./controller.svelte";

  /** Props for a pure standalone email-link completion screen. */
  export interface ShortCodeScreenProps {
    controller: ShortCodeScreenController;
  }
</script>

<script lang="ts">
  import { translateShortCodeJourney, translateShortCodeStatus, translateShortCodeTitle } from "#lib/i18n/auth-copy.js";
  import { translateAuthenticationFeedback, translateAuthenticationValidation } from "#lib/i18n/auth-feedback.js";
  import AuthenticationError from "#lib/ui/auth/AuthenticationError.svelte";

  import { tick } from "svelte";

  import { getI18nContext } from "@a-novel-kit/nodelib-i18n/svelte";
  import { Button, Field, FormActions, Input, Link, StatusState } from "@a-novel-kit/uikit";

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
  const title = $derived(translateShortCodeTitle(t, model));
  const unavailableStatus = $derived(
    model.state.status === "missing" || model.state.status === "invalid" ? model.state.status : null
  );
  const hasOutcome = $derived(
    model.journey === "email-update" || unavailableStatus !== null || model.state.status === "success"
  );

  function issueMessage(
    currentIssues: readonly FormIssue<ShortCodePasswordField>[],
    field: ShortCodePasswordField
  ): string | undefined {
    const issue = currentIssues.find((candidate) => candidate.field === field);
    return issue ? translateAuthenticationValidation(t, issue) : undefined;
  }

  async function submit(event: SubmitEvent) {
    const form = event.currentTarget as HTMLFormElement;
    if (controller.submit(new FormData(form))) return;
    event.preventDefault();
    await tick();
    form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }
</script>

<main class="standalone-page">
  <section class="secure-action" aria-labelledby={hasOutcome ? undefined : `${componentId}-title`}>
    {#if !hasOutcome && model.journey !== "email-update"}
      <header class="page-heading">
        <h1 id={`${componentId}-title`}>{title}</h1>
        <p>{translateShortCodeJourney(t, model.journey, "description")}</p>
      </header>
    {/if}

    {#if unavailableStatus}
      <StatusState
        tone="error"
        {title}
        headingLevel={1}
        description={translateShortCodeStatus(t, unavailableStatus, "description")}
      >
        {#snippet actions()}
          <!-- Invitations are issued by the team, so a dead one leads back to the invitation list. -->
          <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- The pure screen receives app-resolved URLs. -->
          <Link href={restartHref}>
            {model.journey === "register" ? t("shell.auth.createAccount") : t("authUi.shortCode.restart")}
          </Link>
        {/snippet}
      </StatusState>
    {:else if model.state.status === "success"}
      <StatusState tone="success" {title} headingLevel={1}>
        {#snippet actions()}
          <!-- A password reset returns no session, so it continues to the login form. -->
          <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- The pure screen receives app-resolved URLs. -->
          <Link href={continueHref}>
            {model.journey === "password-reset" ? t("shell.signIn") : t("authUi.shortCode.continue")}
          </Link>
        {/snippet}
      </StatusState>
    {:else if model.journey === "email-update"}
      {#if model.state.status === "service-error"}
        <StatusState
          tone="error"
          {title}
          description={translateAuthenticationFeedback(t, model.state.feedback)}
          headingLevel={1}
        >
          {#snippet actions()}
            <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- The pure screen receives app-resolved URLs. -->
            <Link href={restartHref}>{t("authUi.shortCode.restart")}</Link>
          {/snippet}
        </StatusState>
      {:else}
        <StatusState tone="loading" {title} headingLevel={1} />
        <noscript>
          <form method="POST" {action}>
            <Button type="submit">{t("authUi.shortCode.journeys.emailUpdate.submit")}</Button>
          </form>
        </noscript>
      {/if}
    {:else}
      <form method="POST" {action} aria-busy={submitting} novalidate onsubmit={submit}>
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
              readonly={submitting}
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
              readonly={submitting}
              invalid={Boolean(issueMessage(issues, "confirmPassword"))}
            />
          {/snippet}
        </Field>

        <FormActions>
          {#snippet feedback()}
            {#if model.state.status === "service-error"}
              <AuthenticationError feedback={model.state.feedback} />
            {/if}
          {/snippet}
          <Button type="submit" disabled={submitting}>
            {translateShortCodeJourney(t, model.journey, submitting ? "submitting" : "submit")}
          </Button>
        </FormActions>
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
  form {
    display: grid;
    gap: var(--space-4);
    min-inline-size: 0;
  }

  .secure-action {
    align-self: center;
    gap: var(--space-6);
    margin-inline: auto;
    inline-size: 100%;
    max-inline-size: var(--layout-readable-measure);
  }

  .page-heading {
    display: grid;
    gap: var(--space-2);
  }

  .page-heading h1,
  .page-heading p {
    margin: 0;
  }

  .page-heading h1 {
    font-size: var(--font-size-2xl);
    line-height: var(--line-height-tight);
    font-family: var(--font-family-display);
  }

  .page-heading p {
    color: var(--color-text-muted);
    line-height: var(--line-height-normal);
  }

  @media (max-width: 34.999rem) {
    .standalone-page {
      padding: var(--space-2);
    }
  }
</style>
