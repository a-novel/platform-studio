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
    DescriptionList,
    Field,
    Grid,
    Input,
    PageHeader,
    Spinner,
    Stack,
  } from "@a-novel-kit/uikit";

  import { CircleCheck, Info, ShieldCheck } from "@lucide/svelte";

  let { controller }: AccountScreenProps = $props();

  const model = $derived(controller.state.model);
  const actions = $derived(controller.state.actions);

  const componentId = $props.id();
  const { t } = getI18nContext();
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

{#snippet infoIcon()}<Info size="var(--icon-size-md)" />{/snippet}
{#snippet successIcon()}<CircleCheck size="var(--icon-size-md)" />{/snippet}
<Container size="lg">
  <Stack gap="6">
    <PageHeader
      eyebrow={t("authUi.account.eyebrow")}
      title={t("authUi.account.title")}
      description={t("authUi.account.description")}
    />

    {#if model.status === "loading"}
      <Alert tone="info" title={t("authUi.account.loadingTitle")}>
        <div class="loading-message">
          <Spinner label={t("authUi.account.loadingTitle")} size="sm" />
          <span>{t("authUi.account.loadingDescription")}</span>
        </div>
      </Alert>
    {:else if model.status === "error"}
      <Alert tone="error" title={t("authUi.account.loadErrorTitle")}>
        <p class="feedback-message">{translateAuthenticationFeedback(t, model.feedback)}</p>
      </Alert>
    {:else}
      <Grid minItemWidth="lg" gap="4">
        <Card class="claims-card" surface="subtle" padding="lg">
          <section class="card-section" aria-labelledby={`${componentId}-claims-title`}>
            <div class="section-heading">
              <ShieldCheck size="var(--icon-size-md)" aria-hidden="true" />
              <div>
                <h2 id={`${componentId}-claims-title`}>{t("authUi.account.claims.title")}</h2>
                <p>{t("authUi.account.claims.description")}</p>
              </div>
            </div>

            <DescriptionList columns={2} density="compact">
              <div>
                <dt>{t("authUi.account.claims.userId")}</dt>
                <dd class="monospace">{model.claims.userId}</dd>
              </div>
              <div>
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
              <div>
                <dt>{t("authUi.account.claims.accessExpiresAt")}</dt>
                <dd>{model.claims.accessExpiresAt}</dd>
              </div>
              <div>
                <dt>{t("authUi.account.claims.refreshExpiresAt")}</dt>
                <dd>{model.claims.refreshExpiresAt}</dd>
              </div>
            </DescriptionList>

            <Alert tone="info" title={t("authUi.account.claims.privacyTitle")} icon={infoIcon}>
              <p class="feedback-message">{t("authUi.account.claims.privacyDescription")}</p>
            </Alert>
          </section>
        </Card>

        <Card surface="raised" padding="lg">
          <section class="card-section" aria-labelledby={`${componentId}-password-title`}>
            <div class="section-heading">
              <div>
                <h2 id={`${componentId}-password-title`}>{t("authUi.account.password.title")}</h2>
                <p>{t("authUi.account.password.description")}</p>
              </div>
            </div>

            {#if model.passwordState.status === "success"}
              <Alert tone="success" title={t("authUi.account.password.successTitle")} icon={successIcon}>
                <p class="feedback-message">
                  {translateAuthenticationFeedback(t, model.passwordState.feedback)}
                </p>
              </Alert>
            {/if}

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
              {#if model.passwordState.status === "service-error"}
                <Alert
                  class="compact-form-error"
                  tone="error"
                  title={translateAuthenticationFeedback(t, model.passwordState.feedback)}
                />
              {/if}
              <Button type="submit" disabled={model.passwordState.status === "submitting"}>
                {model.passwordState.status === "submitting"
                  ? t("authUi.account.password.submitting")
                  : t("authUi.account.password.submit")}
              </Button>
            </form>
          </section>
        </Card>

        <Card surface="raised" padding="lg">
          <section class="card-section" aria-labelledby={`${componentId}-email-title`}>
            <div class="section-heading">
              <div>
                <h2 id={`${componentId}-email-title`}>{t("authUi.account.email.title")}</h2>
                <p>{t("authUi.account.email.description")}</p>
              </div>
            </div>

            {#if model.emailState.status === "success"}
              <Alert tone="success" title={t("authUi.account.email.successTitle")} icon={successIcon}>
                <p class="feedback-message">{translateAuthenticationFeedback(t, model.emailState.feedback)}</p>
              </Alert>
            {:else if model.emailState.status === "pending-email"}
              <Alert tone="success" title={t("authUi.account.email.pendingTitle")}>
                <p class="pending-copy">
                  {t("authUi.account.email.pendingDescription")} <strong>{model.emailState.targetHint}</strong>
                </p>
              </Alert>
            {/if}

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
              {#if model.emailState.status === "service-error"}
                <Alert
                  class="compact-form-error"
                  tone="error"
                  title={translateAuthenticationFeedback(t, model.emailState.feedback)}
                />
              {/if}
              <Button type="submit" disabled={model.emailState.status === "submitting"}>
                {#if model.emailState.status === "submitting"}
                  {t("authUi.account.email.submitting")}
                {:else if model.emailState.status === "pending-email"}
                  {t("authUi.account.email.resend")}
                {:else}
                  {t("authUi.account.email.submit")}
                {/if}
              </Button>
            </form>
          </section>
        </Card>

        <Card class="logout-card" surface="subtle" padding="lg">
          <section class="logout-section" aria-labelledby={`${componentId}-logout-title`}>
            <div class="section-heading">
              <div>
                <h2 id={`${componentId}-logout-title`}>{t("authUi.account.logout.title")}</h2>
                <p>{t("authUi.account.logout.description")}</p>
              </div>
            </div>
            <form
              method="POST"
              action={actions.logout}
              aria-busy={model.logoutState === "submitting"}
              onsubmit={submitLogout}
            >
              {#if typeof model.logoutState === "object"}
                <Alert
                  class="compact-form-error"
                  tone="error"
                  title={translateAuthenticationFeedback(t, model.logoutState.feedback)}
                />
              {/if}
              <Button type="submit" variant="outline" tone="danger" disabled={model.logoutState === "submitting"}>
                {model.logoutState === "submitting"
                  ? t("authUi.account.logout.submitting")
                  : t("authUi.account.logout.submit")}
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
  form {
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
  .pending-copy {
    margin: 0;
  }

  h2 {
    color: var(--color-text-primary);
    font-size: var(--font-size-xl);
    font-family: var(--font-family-display);
  }

  .section-heading p,
  .feedback-message,
  .pending-copy {
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

  .monospace {
    font-family: var(--font-family-mono);
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
