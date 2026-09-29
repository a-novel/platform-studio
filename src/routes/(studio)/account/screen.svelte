<script module lang="ts">
  import type { FormIssue } from "$lib/application/auth/types";

  import type { AccountScreenController } from "./controller.svelte";

  /** Props for the pure protected account-management screen. */
  export interface AccountScreenProps {
    controller: AccountScreenController;
  }
</script>

<script lang="ts">
  import { translateAuthenticationFeedback, translateAuthenticationValidation } from "$lib/i18n/auth-feedback";

  import { getI18nContext } from "@a-novel-kit/nodelib-i18n/svelte";
  import {
    Alert,
    Badge,
    Button,
    Card,
    Container,
    Field,
    FormActions,
    Input,
    PageHeader,
    Stack,
  } from "@a-novel-kit/uikit";

  import { ShieldCheck } from "@lucide/svelte";

  let { controller }: AccountScreenProps = $props();

  const model = $derived(controller.state.model);
  const actions = $derived(controller.state.actions);

  const componentId = $props.id();
  const { t } = getI18nContext();
  const currentPasswordId = `${componentId}-current-password`;
  const newPasswordId = `${componentId}-new-password`;
  const confirmPasswordId = `${componentId}-confirm-password`;
  const newEmailId = `${componentId}-new-email`;

  const passwordIssues = $derived(model.passwordState.status === "validation-error" ? model.passwordState.issues : []);
  const emailIssues = $derived(model.emailState.status === "validation-error" ? model.emailState.issues : []);
  function issueMessage<Field extends string>(issues: readonly FormIssue<Field>[], field: Field): string | undefined {
    const issue = issues.find((candidate) => candidate.field === field);
    return issue ? translateAuthenticationValidation(t, issue.feedback) : undefined;
  }

  function submitPassword(event: SubmitEvent) {
    if (!controller.submitPassword()) event.preventDefault();
  }

  function submitEmail(event: SubmitEvent) {
    if (!controller.submitEmail()) event.preventDefault();
  }

  function submitLogout(event: SubmitEvent) {
    if (!controller.submitLogout()) event.preventDefault();
  }
</script>

<div class="account-screen">
  <Container size="sm" gutter={false}>
    <Stack gap="6">
      <PageHeader title={t("authUi.account.title")} description={t("authUi.account.description")} />

      <Stack gap="4">
        <Card surface="raised">
          <section id="account-password" class="card-section" aria-labelledby={`${componentId}-password-title`}>
            <header class="section-heading">
              <h2 id={`${componentId}-password-title`}>{t("authUi.account.password.title")}</h2>
            </header>

            <form
              method="POST"
              action={actions.password}
              aria-busy={model.passwordState.status === "submitting"}
              onsubmit={submitPassword}
            >
              <Field
                controlId={currentPasswordId}
                label={t("authUi.account.password.currentLabel")}
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
                label={t("authUi.account.password.newLabel")}
                hint={t("authUi.account.password.hint")}
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
                label={t("authUi.account.password.confirmLabel")}
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
              <FormActions>
                {#snippet feedback()}
                  {#if model.passwordState.status === "service-error"}
                    <Alert tone="error" title={translateAuthenticationFeedback(t, model.passwordState.feedback)} />
                  {:else if model.passwordState.status === "success"}
                    <Alert tone="success" title={translateAuthenticationFeedback(t, model.passwordState.feedback)} />
                  {/if}
                {/snippet}
                <Button type="submit" disabled={model.passwordState.status === "submitting"}>
                  {model.passwordState.status === "submitting"
                    ? t("authUi.account.password.submitting")
                    : t("authUi.account.password.submit")}
                </Button>
              </FormActions>
            </form>
          </section>
        </Card>

        <Card surface="raised">
          <section id="account-email" class="card-section" aria-labelledby={`${componentId}-email-title`}>
            <header class="section-heading">
              <h2 id={`${componentId}-email-title`}>{t("authUi.account.email.title")}</h2>
              <p>{t("authUi.account.email.description")}</p>
            </header>

            <form
              method="POST"
              action={actions.email}
              aria-busy={model.emailState.status === "submitting"}
              onsubmit={submitEmail}
            >
              <Field
                controlId={newEmailId}
                label={t("authUi.account.email.label")}
                hint={t("authUi.account.email.hint")}
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
              <FormActions>
                {#snippet feedback()}
                  {#if model.emailState.status === "service-error"}
                    <Alert tone="error" title={translateAuthenticationFeedback(t, model.emailState.feedback)} />
                  {:else if model.emailState.status === "pending-email"}
                    <Alert tone="success" title={t("authUi.account.email.pendingTitle")}>
                      <p class="pending-copy">
                        {t("authUi.account.email.pendingDescription")} <strong>{model.emailState.targetHint}</strong>
                      </p>
                    </Alert>
                  {/if}
                {/snippet}
                <Button type="submit" disabled={model.emailState.status === "submitting"}>
                  {#if model.emailState.status === "submitting"}
                    {t("authUi.account.email.submitting")}
                  {:else if model.emailState.status === "pending-email"}
                    {t("authUi.account.email.resend")}
                  {:else}
                    {t("authUi.account.email.submit")}
                  {/if}
                </Button>
              </FormActions>
            </form>
          </section>
        </Card>

        <section id="account-claims" class="session-summary" aria-labelledby={`${componentId}-claims-title`}>
          <div class="section-heading">
            <ShieldCheck size="var(--icon-size-md)" aria-hidden="true" />
            <h2 id={`${componentId}-claims-title`}>{t("authUi.account.claims.title")}</h2>
          </div>

          {#if model.claims.status === "loading"}
            <Alert tone="loading" title={t("authUi.account.loadingTitle")} />
          {:else if model.claims.status === "error"}
            <Alert tone="error" title={t("authUi.account.loadErrorTitle")}>
              <p class="feedback-message">{translateAuthenticationFeedback(t, model.claims.feedback)}</p>
            </Alert>
          {:else}
            <dl class="session-details">
              <div class="session-identity">
                <dt>{t("authUi.account.claims.userId")}</dt>
                <dd class="monospace">{model.claims.userId}</dd>
              </div>
              <div class="session-identity">
                <dt>{t("authUi.account.claims.roles")}</dt>
                <dd>
                  <div class="roles">
                    {#each model.claims.roles as role (role)}
                      <Badge tone="brand">{role}</Badge>
                    {:else}
                      <span>{t("authUi.account.claims.noRoles")}</span>
                    {/each}
                  </div>
                </dd>
              </div>
              <div class="session-expiry">
                <dt>{t("authUi.account.claims.accessExpiresAt")}</dt>
                <dd>{model.claims.accessExpiresAt}</dd>
              </div>
              <div class="session-expiry">
                <dt>{t("authUi.account.claims.refreshExpiresAt")}</dt>
                <dd>{model.claims.refreshExpiresAt}</dd>
              </div>
            </dl>
          {/if}

          <form
            id="account-session"
            method="POST"
            action={actions.logout}
            aria-busy={model.logoutState === "submitting"}
            onsubmit={submitLogout}
          >
            <p class="feedback-message">{t("authUi.account.logout.description")}</p>
            <FormActions>
              {#snippet feedback()}
                {#if typeof model.logoutState === "object"}
                  <Alert tone="error" title={translateAuthenticationFeedback(t, model.logoutState.feedback)} />
                {/if}
              {/snippet}
              <Button type="submit" variant="outline" tone="neutral" disabled={model.logoutState === "submitting"}>
                {model.logoutState === "submitting"
                  ? t("authUi.account.logout.submitting")
                  : t("authUi.account.logout.submit")}
              </Button>
            </FormActions>
          </form>
        </section>
      </Stack>
    </Stack>
  </Container>
</div>

<style>
  .account-screen {
    padding-inline: var(--layout-gutter);
    padding-block: var(--space-6) var(--space-12);
  }

  .session-summary,
  .card-section,
  form {
    display: grid;
    gap: var(--space-4);
    min-inline-size: 0;
  }

  .card-section,
  .session-summary,
  #account-session {
    scroll-margin-block-start: var(--space-5);
  }

  .session-summary {
    padding-block-start: var(--space-4);
  }

  .section-heading {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
  }

  .section-heading > :global(svg) {
    flex: none;
    align-self: center;
    color: var(--color-text-accent);
  }

  header.section-heading {
    display: grid;
    gap: var(--space-2);
  }

  h2,
  .section-heading p,
  .feedback-message,
  .pending-copy {
    margin: 0;
  }

  h2 {
    min-inline-size: 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-xl);
    font-family: var(--font-family-display);
    overflow-wrap: anywhere;
  }

  .section-heading p,
  .feedback-message,
  .pending-copy {
    color: var(--color-text-secondary);
    line-height: var(--line-height-normal);
  }

  @media (min-width: 35rem) {
    .session-details {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  .session-details {
    display: grid;
    gap: var(--space-4);
    margin: 0;
  }

  .session-details > div {
    display: grid;
    align-content: start;
    gap: var(--space-1);
    min-inline-size: 0;
  }

  .session-identity {
    grid-column: 1 / -1;
  }

  .session-details dt {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }

  .session-details dd {
    margin: 0;
    line-height: var(--line-height-normal);
    overflow-wrap: anywhere;
  }

  .roles {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
  }

  .monospace {
    font-size: var(--font-size-sm);
    font-family: var(--font-family-mono);
  }

  .pending-copy strong {
    color: var(--color-text-primary);
    overflow-wrap: anywhere;
  }

  @media (max-width: 34.999rem) {
    .account-screen {
      padding-inline: var(--space-2);
      padding-block-start: var(--space-3);
    }

    .session-details {
      gap: var(--space-3);
    }

    .session-details > .session-expiry {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: baseline;
      gap: var(--space-1) var(--space-3);
      font-size: var(--font-size-sm);
    }
  }
</style>
