<script module lang="ts">
  import type { AuthenticationPanelController } from "./controller.svelte";

  /** Props for the pure form rendered inside the shell authentication dialog. */
  export interface AuthenticationPanelProps {
    controller: AuthenticationPanelController;
  }
</script>

<script lang="ts">
  import type { AuthenticationField } from "#lib/application/auth/types.js";
  import { translateAuthenticationJourney } from "#lib/i18n/auth-copy.js";
  import { translateAuthenticationValidation } from "#lib/i18n/auth-feedback.js";
  import AuthenticationError from "#lib/ui/auth/AuthenticationError.svelte";

  import { tick } from "svelte";

  import { getI18nContext } from "@a-novel-kit/nodelib-i18n/svelte";
  import { Alert, Button, Field, FormActions, InlineMessage, Input } from "@a-novel-kit/uikit";

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

  function fieldError(field: AuthenticationField): string | undefined {
    const issue = issues.find((candidate) => candidate.field === field);
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

{#if model.state.status === "pending-email"}
  {@const targetHint = model.state.targetHint}
  <InlineMessage tone="success">
    {t("authUi.authentication.journeys.reset.pendingDescription")} <strong class="pending-target">{targetHint}</strong>
  </InlineMessage>
{:else if model.state.status === "recorded"}
  <InlineMessage tone="success">
    {t("authUi.authentication.journeys.register.recordedDescription")}
    <strong class="pending-target">{model.state.email}</strong>
  </InlineMessage>
{:else}
  <form method="POST" {action} aria-busy={submitting} novalidate onsubmit={submit}>
    <Field controlId={emailId} label={t("authUi.authentication.emailLabel")} error={fieldError("email")} required>
      {#snippet children(control)}
        <Input
          {...control}
          name="email"
          type="email"
          autocomplete={model.journey === "login" ? "username" : "email"}
          autocapitalize="none"
          spellcheck="false"
          readonly={submitting}
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
            readonly={submitting}
            invalid={Boolean(fieldError("password"))}
          />
        {/snippet}
      </Field>
    {/if}

    <FormActions>
      {#snippet feedback()}
        {#if model.state.status === "service-error"}
          <AuthenticationError feedback={model.state.feedback} />
        {:else if model.state.status === "conflict"}
          <Alert
            tone="warning"
            title={model.state.code === "account_exists"
              ? t("authUi.authentication.journeys.register.accountExists")
              : t("authUi.authentication.journeys.register.alreadyWaitlisted")}
          />
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
