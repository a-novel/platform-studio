<script module lang="ts">
  import type { AuthUiCopy } from "$lib/application/auth/copy";
  import type {
    AccountFormActions,
    AccountPasswordField,
    AccountScreenModel,
    FormIssue,
  } from "$lib/application/auth/types";

  /** Props for the pure protected account-management screen. */
  export interface AccountScreenProps {
    copy: AuthUiCopy["account"];
    model: AccountScreenModel;
    actions: AccountFormActions;
    onRetry?: () => void;
    onPasswordSubmit?: (event: SubmitEvent) => void;
    onEmailSubmit?: (event: SubmitEvent) => void;
    onLogoutSubmit?: (event: SubmitEvent) => void;
  }
</script>

<script lang="ts">
  import {
    Alert,
    Badge,
    Button,
    Card,
    Container,
    DescriptionList,
    ErrorSummary,
    Field,
    Grid,
    Input,
    PageHeader,
    Spinner,
    Stack,
  } from "@a-novel-kit/uikit";

  import { CircleCheck, Info, ShieldCheck } from "@lucide/svelte";

  let { copy, model, actions, onRetry, onPasswordSubmit, onEmailSubmit, onLogoutSubmit }: AccountScreenProps = $props();

  const componentId = $props.id();
  const currentPasswordId = `${componentId}-current-password`;
  const newPasswordId = `${componentId}-new-password`;
  const confirmPasswordId = `${componentId}-confirm-password`;
  const newEmailId = `${componentId}-new-email`;

  const passwordIssues = $derived(
    model.status === "ready" && model.passwordState.status === "validation-error" ? model.passwordState.issues : []
  );
  const emailIssues = $derived(
    model.status === "ready" && model.emailState.status === "validation-error" ? model.emailState.issues : []
  );
  const passwordSummary = $derived(
    passwordIssues.map((issue, index) => ({
      id: `${issue.field}-${index}`,
      href: `#${passwordControlId(issue.field)}`,
      message: issue.message,
    }))
  );
  const emailSummary = $derived(
    emailIssues.map((issue, index) => ({
      id: `${issue.field}-${index}`,
      href: `#${newEmailId}`,
      message: issue.message,
    }))
  );

  function issueMessage<Field extends string>(issues: readonly FormIssue<Field>[], field: Field): string | undefined {
    return issues.find((issue) => issue.field === field)?.message;
  }

  function passwordControlId(field: AccountPasswordField): string {
    if (field === "currentPassword") return currentPasswordId;
    if (field === "newPassword") return newPasswordId;
    return confirmPasswordId;
  }
</script>

{#snippet infoIcon()}<Info size="var(--icon-size-md)" />{/snippet}
{#snippet successIcon()}<CircleCheck size="var(--icon-size-md)" />{/snippet}
{#snippet retryAction()}
  <Button variant="outline" tone="neutral" size="sm" onclick={() => onRetry?.()}>{copy.retry}</Button>
{/snippet}

<Container size="lg">
  <Stack gap="6">
    <PageHeader eyebrow={copy.eyebrow} title={copy.title} description={copy.description} />

    {#if model.status === "loading"}
      <Alert tone="info" title={copy.loadingTitle}>
        <div class="loading-message">
          <Spinner label={copy.loadingTitle} size="sm" />
          <span>{copy.loadingDescription}</span>
        </div>
      </Alert>
    {:else if model.status === "error"}
      <Alert tone="error" title={copy.loadErrorTitle} actions={retryAction}>
        <p class="feedback-message">{model.message}</p>
      </Alert>
    {:else}
      <Grid minItemWidth="lg" gap="4">
        <Card class="claims-card" surface="subtle" padding="lg">
          <section class="card-section" aria-labelledby={`${componentId}-claims-title`}>
            <div class="section-heading">
              <ShieldCheck size="var(--icon-size-md)" aria-hidden="true" />
              <div>
                <h2 id={`${componentId}-claims-title`}>{copy.claims.title}</h2>
                <p>{copy.claims.description}</p>
              </div>
            </div>

            <DescriptionList columns={2} density="compact">
              <div>
                <dt>{copy.claims.userId}</dt>
                <dd class="monospace">{model.claims.userId}</dd>
              </div>
              <div>
                <dt>{copy.claims.roles}</dt>
                <dd>
                  <div class="roles">
                    {#each model.claims.roles as role (role)}
                      <Badge tone="brand">{role}</Badge>
                    {:else}
                      <span>{copy.claims.noRoles}</span>
                    {/each}
                  </div>
                </dd>
              </div>
              <div>
                <dt>{copy.claims.accessExpiresAt}</dt>
                <dd>{model.claims.accessExpiresAt}</dd>
              </div>
              <div>
                <dt>{copy.claims.refreshExpiresAt}</dt>
                <dd>{model.claims.refreshExpiresAt}</dd>
              </div>
            </DescriptionList>

            <Alert tone="info" title={copy.claims.privacyTitle} icon={infoIcon}>
              <p class="feedback-message">{copy.claims.privacyDescription}</p>
            </Alert>
          </section>
        </Card>

        <Card surface="raised" padding="lg">
          <section class="card-section" aria-labelledby={`${componentId}-password-title`}>
            <div class="section-heading">
              <div>
                <h2 id={`${componentId}-password-title`}>{copy.password.title}</h2>
                <p>{copy.password.description}</p>
              </div>
            </div>

            {#if model.passwordState.status === "validation-error"}
              <ErrorSummary
                title={copy.password.validationTitle}
                errors={passwordSummary}
                headingLevel={3}
                focusOnMount
              />
            {:else if model.passwordState.status === "service-error"}
              <Alert tone="error" title={copy.password.serviceErrorTitle}>
                <p class="feedback-message">{model.passwordState.message}</p>
              </Alert>
            {:else if model.passwordState.status === "success"}
              <Alert tone="success" title={copy.password.successTitle} icon={successIcon}>
                <p class="feedback-message">{model.passwordState.message}</p>
              </Alert>
            {/if}

            <form
              method="POST"
              action={actions.password}
              aria-busy={model.passwordState.status === "submitting"}
              onsubmit={onPasswordSubmit}
            >
              <Field
                controlId={currentPasswordId}
                label={copy.password.currentLabel}
                error={issueMessage(passwordIssues, "currentPassword")}
                required
              >
                {#snippet children(control)}
                  <Input
                    {...control}
                    name="currentPassword"
                    type="password"
                    autocomplete="current-password"
                    disabled={model.passwordState.status === "submitting"}
                    invalid={Boolean(issueMessage(passwordIssues, "currentPassword"))}
                  />
                {/snippet}
              </Field>
              <Field
                controlId={newPasswordId}
                label={copy.password.newLabel}
                hint={copy.password.hint}
                error={issueMessage(passwordIssues, "newPassword")}
                required
              >
                {#snippet children(control)}
                  <Input
                    {...control}
                    name="password"
                    type="password"
                    autocomplete="new-password"
                    disabled={model.passwordState.status === "submitting"}
                    invalid={Boolean(issueMessage(passwordIssues, "newPassword"))}
                  />
                {/snippet}
              </Field>
              <Field
                controlId={confirmPasswordId}
                label={copy.password.confirmLabel}
                error={issueMessage(passwordIssues, "confirmPassword")}
                required
              >
                {#snippet children(control)}
                  <Input
                    {...control}
                    name="confirmPassword"
                    type="password"
                    autocomplete="new-password"
                    disabled={model.passwordState.status === "submitting"}
                    invalid={Boolean(issueMessage(passwordIssues, "confirmPassword"))}
                  />
                {/snippet}
              </Field>
              <Button type="submit" disabled={model.passwordState.status === "submitting"}>
                {#if model.passwordState.status === "submitting"}
                  <Spinner label={copy.password.submitting} size="sm" />
                  <span aria-hidden="true">{copy.password.submitting}</span>
                {:else}
                  {copy.password.submit}
                {/if}
              </Button>
            </form>
          </section>
        </Card>

        <Card surface="raised" padding="lg">
          <section class="card-section" aria-labelledby={`${componentId}-email-title`}>
            <div class="section-heading">
              <div>
                <h2 id={`${componentId}-email-title`}>{copy.email.title}</h2>
                <p>{copy.email.description}</p>
              </div>
            </div>

            {#if model.emailState.status === "validation-error"}
              <ErrorSummary title={copy.email.validationTitle} errors={emailSummary} headingLevel={3} focusOnMount />
            {:else if model.emailState.status === "service-error"}
              <Alert tone="error" title={copy.email.serviceErrorTitle}>
                <p class="feedback-message">{model.emailState.message}</p>
              </Alert>
            {:else if model.emailState.status === "success"}
              <Alert tone="success" title={copy.email.successTitle} icon={successIcon}>
                <p class="feedback-message">{model.emailState.message}</p>
              </Alert>
            {:else if model.emailState.status === "pending-email"}
              <Alert tone="success" title={copy.email.pendingTitle}>
                <div class="pending-copy">
                  <p>{copy.email.pendingDescription}</p>
                  <dl class="pending-target">
                    <dt>{copy.email.pendingTargetLabel}</dt>
                    <dd>{model.emailState.targetHint}</dd>
                  </dl>
                  <p>{copy.email.pendingPrivacy}</p>
                </div>
              </Alert>
            {/if}

            <form
              method="POST"
              action={actions.email}
              aria-busy={model.emailState.status === "submitting"}
              onsubmit={onEmailSubmit}
            >
              <Field
                controlId={newEmailId}
                label={copy.email.label}
                hint={copy.email.hint}
                error={issueMessage(emailIssues, "newEmail")}
                required
              >
                {#snippet children(control)}
                  <Input
                    {...control}
                    name="email"
                    type="email"
                    autocomplete="email"
                    autocapitalize="none"
                    spellcheck="false"
                    disabled={model.emailState.status === "submitting"}
                    invalid={Boolean(issueMessage(emailIssues, "newEmail"))}
                  />
                {/snippet}
              </Field>
              <Button type="submit" disabled={model.emailState.status === "submitting"}>
                {#if model.emailState.status === "submitting"}
                  <Spinner label={copy.email.submitting} size="sm" />
                  <span aria-hidden="true">{copy.email.submitting}</span>
                {:else if model.emailState.status === "pending-email"}
                  {copy.email.resend}
                {:else}
                  {copy.email.submit}
                {/if}
              </Button>
            </form>
          </section>
        </Card>

        <Card class="logout-card" surface="subtle" padding="lg">
          <section class="logout-section" aria-labelledby={`${componentId}-logout-title`}>
            <div class="section-heading">
              <div>
                <h2 id={`${componentId}-logout-title`}>{copy.logout.title}</h2>
                <p>{copy.logout.description}</p>
              </div>
            </div>
            {#if typeof model.logoutState === "object"}
              <Alert tone="error" title={copy.logout.serviceErrorTitle}>
                <p class="feedback-message">{model.logoutState.message}</p>
              </Alert>
            {/if}
            <form
              method="POST"
              action={actions.logout}
              aria-busy={model.logoutState === "submitting"}
              onsubmit={onLogoutSubmit}
            >
              <Button type="submit" variant="outline" tone="danger" disabled={model.logoutState === "submitting"}>
                {#if model.logoutState === "submitting"}
                  <Spinner label={copy.logout.submitting} size="sm" />
                  <span aria-hidden="true">{copy.logout.submitting}</span>
                {:else}
                  {copy.logout.submit}
                {/if}
              </Button>
            </form>
          </section>
        </Card>
      </Grid>
    {/if}
  </Stack>
</Container>

<style>
  :global(.container) {
    padding-block: var(--space-6) var(--space-12);
  }

  :global(.claims-card),
  :global(.logout-card) {
    grid-column: 1 / -1;
  }

  .card-section,
  .logout-section,
  form,
  .pending-copy {
    display: grid;
    gap: var(--space-4);
    min-inline-size: 0;
  }

  .section-heading {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
  }

  .section-heading > :global(svg) {
    flex: none;
    color: var(--color-text-accent);
  }

  h2,
  .section-heading p,
  .feedback-message,
  .pending-copy p,
  .pending-target {
    margin: 0;
  }

  h2 {
    color: var(--color-text-primary);
    font-size: var(--font-size-xl);
    font-family: var(--font-family-display);
  }

  .section-heading p,
  .feedback-message,
  .pending-copy p {
    color: var(--color-text-secondary);
    line-height: var(--line-height-normal);
  }

  form > :global(button) {
    justify-self: start;
  }

  .roles {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
  }

  .monospace,
  .pending-target dd {
    font-family: var(--font-family-mono);
  }

  .pending-target {
    display: grid;
    gap: var(--space-1);
    border-radius: var(--radius-md);
    background: var(--color-surface-island-subtle);
    padding: var(--space-3);
  }

  .pending-target dt {
    color: var(--color-text-muted);
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-xs);
    text-transform: uppercase;
  }

  .pending-target dd {
    margin: 0;
    overflow-wrap: anywhere;
  }

  .loading-message {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  @media (max-width: 35rem) {
    :global(.container) {
      padding-block-start: var(--space-3);
    }
  }
</style>
