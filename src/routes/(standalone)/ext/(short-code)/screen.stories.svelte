<script module lang="ts">
  import { createStorybookTranslator } from "$lib/i18n/storybook";

  import StoryHarness from "./story.svelte";

  import { reviewStoryGlobals } from "@a-novel-kit/uikit-storybook";

  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { expect, within } from "storybook/test";

  const { Story } = defineMeta({
    title: "Authentication/Secure email links",
    tags: ["!autodocs"],
    parameters: {
      layout: "fullscreen",
    },
  });

  async function verifyRegistrationForm({
    canvasElement,
    globals,
  }: {
    canvasElement: HTMLElement;
    globals: Record<string, unknown>;
  }) {
    const canvas = within(canvasElement);
    const t = createStorybookTranslator(globals);
    await expect(
      canvas.getByRole("heading", { name: t("authUi.shortCode.journeys.register.title"), level: 1 })
    ).toBeVisible();
    await expect(canvas.getByLabelText(t("authUi.shortCode.newPasswordLabel"), { exact: false })).toBeVisible();
    await expect(canvas.getByLabelText(t("authUi.shortCode.confirmPasswordLabel"), { exact: false })).toBeVisible();
    await expect(canvas.getByText(t("authUi.shortCode.journeys.register.description"))).toBeVisible();
    await expect(canvas.queryByText(t("authUi.account.password.hint"))).not.toBeInTheDocument();
    expect(canvasElement.textContent).not.toContain("@");
  }

  async function verifyEmailConfirmation({
    canvasElement,
    globals,
  }: {
    canvasElement: HTMLElement;
    globals: Record<string, unknown>;
  }) {
    const canvas = within(canvasElement);
    const t = createStorybookTranslator(globals);
    await expect(canvas.getByRole("button", { name: t("authUi.shortCode.journeys.emailUpdate.submit") })).toBeVisible();
    await expect(canvas.queryByLabelText(t("authUi.shortCode.newPasswordLabel"))).not.toBeInTheDocument();
  }

  async function verifyValidationFeedback({ canvasElement }: { canvasElement: HTMLElement }) {
    await expect(canvasElement.querySelectorAll('[aria-invalid="true"]')).toHaveLength(2);
    await expect(within(canvasElement).queryByRole("link")).not.toBeInTheDocument();
  }

  async function verifySubmittingLocked({
    canvasElement,
    globals,
  }: {
    canvasElement: HTMLElement;
    globals: Record<string, unknown>;
  }) {
    const canvas = within(canvasElement);
    const t = createStorybookTranslator(globals);
    await expect(
      canvas.getByRole("button", { name: t("authUi.shortCode.journeys.passwordReset.submitting") })
    ).toBeDisabled();
    await expect(canvas.getByLabelText(t("authUi.shortCode.newPasswordLabel"), { exact: false })).toBeDisabled();
  }
</script>

<Story
  name="Complete registration — desktop"
  exportName="CompleteRegistrationDesktop"
  globals={reviewStoryGlobals.desktop}
  asChild
  play={verifyRegistrationForm}
>
  <StoryHarness initialModel={{ journey: "register", state: { status: "ready" } }} />
</Story>

<Story
  name="Complete registration — mobile"
  exportName="CompleteRegistrationMobile"
  globals={reviewStoryGlobals.mobile}
  asChild
>
  <StoryHarness initialModel={{ journey: "register", state: { status: "ready" } }} />
</Story>

<Story
  name="Confirm email update — desktop"
  exportName="ConfirmEmailUpdateDesktop"
  globals={reviewStoryGlobals.desktop}
  asChild
  play={verifyEmailConfirmation}
>
  <StoryHarness initialModel={{ journey: "email-update", state: { status: "ready" } }} />
</Story>

<Story
  name="Confirm email update — mobile"
  exportName="ConfirmEmailUpdateMobile"
  globals={reviewStoryGlobals.mobile}
  asChild
>
  <StoryHarness initialModel={{ journey: "email-update", state: { status: "ready" } }} />
</Story>

<Story
  name="Complete password reset — desktop"
  exportName="CompletePasswordResetDesktop"
  globals={reviewStoryGlobals.desktop}
  asChild
>
  <StoryHarness initialModel={{ journey: "password-reset", state: { status: "ready" } }} />
</Story>

<Story
  name="Complete password reset — mobile"
  exportName="CompletePasswordResetMobile"
  globals={reviewStoryGlobals.mobile}
  asChild
>
  <StoryHarness initialModel={{ journey: "password-reset", state: { status: "ready" } }} />
</Story>

<Story name="Missing link details" asChild>
  <StoryHarness initialModel={{ journey: "register", state: { status: "missing" } }} />
</Story>

<Story name="Invalid link" asChild>
  <StoryHarness initialModel={{ journey: "email-update", state: { status: "invalid" } }} />
</Story>

<Story name="Expired link" asChild>
  <StoryHarness initialModel={{ journey: "password-reset", state: { status: "expired" } }} />
</Story>

<Story name="Submitting once" asChild play={verifySubmittingLocked}>
  <StoryHarness initialModel={{ journey: "password-reset", state: { status: "submitting" } }} />
</Story>

<Story name="Validation error" asChild play={verifyValidationFeedback}>
  <StoryHarness
    initialModel={{
      journey: "register",
      state: {
        status: "validation-error",
        issues: [
          { field: "newPassword", feedback: "newPassword" },
          { field: "confirmPassword", feedback: "passwordMismatch" },
        ],
      },
    }}
  />
</Story>

<Story name="Service error" asChild>
  <StoryHarness
    initialModel={{
      journey: "password-reset",
      state: {
        status: "service-error",
        feedback: "serviceUnavailable",
      },
    }}
  />
</Story>

<Story name="Success" asChild>
  <StoryHarness
    initialModel={{
      journey: "register",
      state: { status: "success", feedback: "registrationCompleted" },
    }}
  />
</Story>
