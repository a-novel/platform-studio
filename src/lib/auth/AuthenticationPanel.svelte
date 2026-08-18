<script module lang="ts">
  import type { AuthUiCopy } from "./copy";
  import type { AuthenticationField, AuthenticationPanelModel } from "./types";

  /** Props for the pure form rendered inside the shell authentication dialog. */
  export interface AuthenticationPanelProps {
    copy: AuthUiCopy["authentication"];
    model: AuthenticationPanelModel;
    action: string;
    onSubmit?: (event: SubmitEvent) => void;
  }
</script>

<script lang="ts">
  import { Alert, Button, ErrorSummary, Field, Input, Spinner } from "@a-novel-kit/uikit";

  import { CircleCheck, Mail } from "@lucide/svelte";

  let { copy, model, action, onSubmit }: AuthenticationPanelProps = $props();

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
  const journeyCopy = $derived(copy.journeys[model.journey]);
  const pendingDescription = $derived(
    model.journey === "register" ? copy.journeys.register.pendingDescription : copy.journeys.reset.pendingDescription
  );

  function fieldError(field: AuthenticationField): string | undefined {
    return issues.find((issue) => issue.field === field)?.message;
  }
</script>

{#snippet mailIcon()}<Mail size="var(--icon-size-md)" />{/snippet}
{#snippet successIcon()}<CircleCheck size="var(--icon-size-md)" />{/snippet}

{#if model.state.status === "pending-email"}
  <Alert tone="success" title={copy.pendingTitle} icon={mailIcon}>
    <div class="feedback-copy">
      <p>{pendingDescription}</p>
      <dl>
        <dt>{copy.pendingTargetLabel}</dt>
        <dd>{model.state.targetHint}</dd>
      </dl>
      <p>{copy.pendingPrivacy}</p>
    </div>
  </Alert>
{:else if model.state.status === "success"}
  <Alert tone="success" title={copy.successTitle} icon={successIcon}>
    <p class="feedback-message">{model.state.message}</p>
  </Alert>
{:else}
  <form method="POST" {action} aria-busy={submitting} onsubmit={onSubmit}>
    {#if model.state.status === "validation-error"}
      <ErrorSummary
        title={copy.validationTitle}
        description={copy.validationDescription}
        errors={summaryErrors}
        headingLevel={3}
        focusOnMount
      />
    {:else if model.state.status === "service-error"}
      <Alert tone="error" title={copy.serviceErrorTitle}>
        <p class="feedback-message">{model.state.message}</p>
      </Alert>
    {/if}

    <Field controlId={emailId} label={copy.emailLabel} hint={copy.emailHint} error={fieldError("email")} required>
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
      <Field controlId={passwordId} label={copy.passwordLabel} error={fieldError("password")} required>
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
        <Spinner label={copy.submitting} size="sm" />
        <span aria-hidden="true">{copy.submitting}</span>
      {:else}
        {journeyCopy.submit}
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
    justify-self: start;
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
