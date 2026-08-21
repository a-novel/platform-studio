<script module lang="ts">
  import StoryHarness from "./story.svelte";

  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { expect, within } from "storybook/test";

  const { Story } = defineMeta({
    title: "Authentication/Secure email links",
    tags: ["!autodocs"],
    parameters: {
      layout: "fullscreen",
    },
  });

  async function verifyRegistrationForm({ canvasElement }: { canvasElement: HTMLElement }) {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "Complete your Studio account", level: 1 })).toBeVisible();
    await expect(canvas.getByLabelText(/New password/)).toBeVisible();
    await expect(canvas.getByLabelText(/Confirm new password/)).toBeVisible();
    await expect(canvas.getByText("Set a password to access your Studio account.")).toBeVisible();
    await expect(canvas.queryByText(/Use a unique passphrase/)).not.toBeInTheDocument();
    expect(canvasElement.textContent).not.toContain("@");
  }

  async function verifyEmailConfirmation({ canvasElement }: { canvasElement: HTMLElement }) {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Confirm email change" })).toBeVisible();
    await expect(canvas.queryByLabelText(/New password/)).not.toBeInTheDocument();
  }

  async function verifyValidationFeedback({ canvasElement }: { canvasElement: HTMLElement }) {
    await expect(canvasElement.querySelectorAll('[aria-invalid="true"]')).toHaveLength(2);
    await expect(within(canvasElement).queryByRole("link")).not.toBeInTheDocument();
  }

  async function verifySubmittingLocked({ canvasElement }: { canvasElement: HTMLElement }) {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Resetting password…" })).toBeDisabled();
    await expect(canvas.getByLabelText(/New password/)).toBeDisabled();
  }
</script>

<Story name="Complete registration" asChild play={verifyRegistrationForm}>
  <StoryHarness initialModel={{ journey: "register", state: { status: "ready" } }} />
</Story>

<Story name="Confirm email update" asChild play={verifyEmailConfirmation}>
  <StoryHarness initialModel={{ journey: "email-update", state: { status: "ready" } }} />
</Story>

<Story name="Complete password reset" asChild>
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

<Story name="Narrow service error" asChild>
  <StoryHarness
    frameWidth="22rem"
    initialModel={{
      journey: "email-update",
      state: {
        status: "service-error",
        feedback: "serviceUnavailable",
      },
    }}
  />
</Story>
