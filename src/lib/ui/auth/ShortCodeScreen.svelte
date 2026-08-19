<script module lang="ts">
  import type { AuthUiCopy } from "$lib/application/auth/copy";
  import type { FormIssue, ShortCodePasswordField, ShortCodeScreenModel } from "$lib/application/auth/types";

  /** Props for a pure standalone email-link completion screen. */
  export interface ShortCodeScreenProps {
    copy: AuthUiCopy["shortCode"];
    model: ShortCodeScreenModel;
    action: string;
    homeHref: string;
    restartHref: string;
    continueHref: string;
    onSubmit?: (event: SubmitEvent) => void;
  }
</script>

<script lang="ts">
  import {
    Alert,
    Button,
    Card,
    Container,
    ErrorSummary,
    Field,
    Input,
    Link,
    PageHeader,
    Spinner,
  } from "@a-novel-kit/uikit";

  import { CircleCheck, KeyRound } from "@lucide/svelte";

  let { copy, model, action, homeHref, restartHref, continueHref, onSubmit }: ShortCodeScreenProps = $props();

  const componentId = $props.id();
  const newPasswordId = `${componentId}-new-password`;
  const confirmPasswordId = `${componentId}-confirm-password`;
  const submitting = $derived(model.state.status === "submitting");
  const issues = $derived(model.state.status === "validation-error" ? model.state.issues : []);
  const summaryErrors = $derived(
    issues.map((issue, index) => ({
      id: `${issue.field}-${index}`,
      href: `#${issue.field === "newPassword" ? newPasswordId : confirmPasswordId}`,
      message: issue.message,
    }))
  );
  const journeyCopy = $derived(
    model.journey === "register"
      ? copy.journeys.register
      : model.journey === "email-update"
        ? copy.journeys.emailUpdate
        : copy.journeys.passwordReset
  );
  const unavailableCopy = $derived(
    model.state.status === "missing" || model.state.status === "invalid" || model.state.status === "expired"
      ? copy.states[model.state.status]
      : null
  );

  function issueMessage(
    currentIssues: readonly FormIssue<ShortCodePasswordField>[],
    field: ShortCodePasswordField
  ): string | undefined {
    return currentIssues.find((issue) => issue.field === field)?.message;
  }
</script>

{#snippet successIcon()}<CircleCheck size="var(--icon-size-md)" />{/snippet}

<div class="standalone-viewport">
  <header class="standalone-header">
    <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- The pure screen receives app-resolved URLs. -->
    <a class="brand" href={homeHref} aria-label={copy.home}>
      <span class="brand-mark" aria-hidden="true">A</span>
      <span>{copy.brand}</span>
    </a>
  </header>

  <main>
    <Container size="readable">
      <Card surface="raised" padding="lg">
        <div class="completion-card">
          <PageHeader eyebrow={copy.eyebrow} title={journeyCopy.title} description={journeyCopy.description} />

          {#if model.targetHint}
            <dl class="target">
              <dt>{copy.targetLabel}</dt>
              <dd>{model.targetHint}</dd>
            </dl>
          {/if}

          {#if unavailableCopy}
            <Alert tone="error" title={unavailableCopy.title}>
              <div class="status-copy">
                <p>{unavailableCopy.description}</p>
                <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- The pure screen receives app-resolved URLs. -->
                <Link href={restartHref}>{copy.restart}</Link>
              </div>
            </Alert>
          {:else if model.state.status === "success"}
            <Alert tone="success" title={copy.successTitle} icon={successIcon}>
              <div class="status-copy">
                <p>{model.state.message}</p>
                <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- The pure screen receives app-resolved URLs. -->
                <Link href={continueHref}>{copy.continue}</Link>
              </div>
            </Alert>
          {:else}
            <form method="POST" {action} aria-busy={submitting} onsubmit={onSubmit}>
              {#if model.state.status === "validation-error"}
                <ErrorSummary
                  title={copy.validationTitle}
                  description={copy.validationDescription}
                  errors={summaryErrors}
                  headingLevel={2}
                  focusOnMount
                />
              {:else if model.state.status === "service-error"}
                <Alert tone="error" title={copy.serviceErrorTitle}>
                  <p class="feedback-message">{model.state.message}</p>
                </Alert>
              {/if}

              {#if model.journey !== "email-update"}
                <Field
                  controlId={newPasswordId}
                  label={copy.newPasswordLabel}
                  hint={copy.passwordHint}
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
                  label={copy.confirmPasswordLabel}
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

              <Button type="submit" disabled={submitting}>
                {#if submitting}
                  <Spinner label={copy.submitting} size="sm" />
                  <span aria-hidden="true">{copy.submitting}</span>
                {:else}
                  <KeyRound size="var(--icon-size-sm)" aria-hidden="true" />
                  {journeyCopy.submit}
                {/if}
              </Button>
            </form>
          {/if}
        </div>
      </Card>
    </Container>
  </main>
</div>

<style>
  .standalone-viewport {
    display: grid;
    grid-template-rows: auto 1fr;
    background:
      radial-gradient(circle at 80% 10%, var(--color-surface-selected), transparent 30rem), var(--color-surface-canvas);
    min-block-size: 100dvb;
    color: var(--color-text-primary);
  }

  .standalone-header {
    display: flex;
    align-items: center;
    border-block-end: var(--border-width-thin) solid var(--color-border-subtle);
    background: var(--color-surface-sunken);
    padding: var(--space-2) var(--layout-gutter);
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    font-weight: var(--font-weight-bold);
    font-family: var(--font-family-display);
    text-decoration: none;
  }

  .brand:focus-visible {
    outline: var(--focus-ring-width) solid var(--color-focus-ring);
    outline-offset: var(--focus-ring-offset);
  }

  .brand-mark {
    display: inline-grid;
    place-items: center;
    border: var(--border-width-thin) solid var(--color-border-selected);
    border-radius: var(--radius-md);
    background: var(--color-surface-selected);
    inline-size: var(--control-height-sm);
    block-size: var(--control-height-sm);
    color: var(--color-text-accent);
  }

  main {
    display: grid;
    align-items: center;
    padding-block: var(--space-8);
  }

  .completion-card,
  form,
  .status-copy {
    display: grid;
    gap: var(--space-4);
    min-inline-size: 0;
  }

  form > :global(button) {
    justify-self: start;
  }

  .target {
    display: grid;
    gap: var(--space-1);
    margin: 0;
    border-radius: var(--radius-md);
    background: var(--color-surface-island-subtle);
    padding: var(--space-3);
  }

  .target dt {
    color: var(--color-text-muted);
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-xs);
    text-transform: uppercase;
  }

  .target dd {
    margin: 0;
    font-family: var(--font-family-mono);
    overflow-wrap: anywhere;
  }

  .status-copy p,
  .feedback-message {
    margin: 0;
    line-height: var(--line-height-normal);
  }

  @media (max-width: 35rem) {
    main {
      align-items: start;
      padding-block: var(--space-3);
    }
  }

  @media (forced-colors: active) {
    .standalone-header,
    .brand-mark {
      border-color: CanvasText;
    }
  }
</style>
