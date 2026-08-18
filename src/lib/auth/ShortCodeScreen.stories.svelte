<script module lang="ts">
  import ShortCodeScreenStory from "./ShortCodeScreenStory.svelte";
  import { getAuthStoryCopy } from "./story-copy";

  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { expect, within } from "storybook/test";

  const english = getAuthStoryCopy("en");
  const french = getAuthStoryCopy("fr");

  const { Story } = defineMeta({
    title: "Authentication/Secure email links",
    tags: ["autodocs"],
    parameters: {
      layout: "fullscreen",
      docs: {
        description: {
          component:
            "Standalone progressive POST surfaces for registration, email update, and password reset. Short codes and raw targets never enter the view model, stories, or rendered form.",
        },
      },
    },
  });

  async function verifyRegistrationForm({ canvasElement }: { canvasElement: HTMLElement }) {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "Complete your Studio account", level: 1 })).toBeVisible();
    await expect(canvas.getByLabelText(/New password/)).toBeVisible();
    await expect(canvas.getByLabelText(/Confirm new password/)).toBeVisible();
  }

  async function verifyEmailConfirmation({ canvasElement }: { canvasElement: HTMLElement }) {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Confirm email change" })).toBeVisible();
    await expect(canvas.queryByLabelText(/New password/)).not.toBeInTheDocument();
  }

  async function verifyValidationLink({ canvasElement }: { canvasElement: HTMLElement }) {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: "The passwords do not match." });
    await expect(link.getAttribute("href")).toMatch(/-confirm-password$/);
  }

  async function verifySubmittingLocked({ canvasElement }: { canvasElement: HTMLElement }) {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Securing your account…" })).toBeDisabled();
    await expect(canvas.getByLabelText(/New password/)).toBeDisabled();
  }
</script>

<Story name="Complete registration" asChild play={verifyRegistrationForm}>
  <ShortCodeScreenStory
    copy={english.auth.shortCode}
    initialModel={{ journey: "register", state: { status: "ready" }, targetHint: "m•••@example.test" }}
  />
</Story>

<Story name="Confirm email update" asChild play={verifyEmailConfirmation}>
  <ShortCodeScreenStory
    copy={english.auth.shortCode}
    initialModel={{ journey: "email-update", state: { status: "ready" }, targetHint: "n••••••@example.test" }}
  />
</Story>

<Story name="Complete password reset" asChild>
  <ShortCodeScreenStory
    copy={english.auth.shortCode}
    initialModel={{ journey: "password-reset", state: { status: "ready" } }}
  />
</Story>

<Story name="Missing link details" asChild>
  <ShortCodeScreenStory
    copy={english.auth.shortCode}
    initialModel={{ journey: "register", state: { status: "missing" } }}
  />
</Story>

<Story name="Invalid link" asChild>
  <ShortCodeScreenStory
    copy={english.auth.shortCode}
    initialModel={{ journey: "email-update", state: { status: "invalid" } }}
  />
</Story>

<Story name="Expired link" asChild>
  <ShortCodeScreenStory
    copy={english.auth.shortCode}
    initialModel={{ journey: "password-reset", state: { status: "expired" } }}
  />
</Story>

<Story name="Submitting once" asChild play={verifySubmittingLocked}>
  <ShortCodeScreenStory
    copy={english.auth.shortCode}
    initialModel={{ journey: "password-reset", state: { status: "submitting" } }}
  />
</Story>

<Story name="Validation error" asChild play={verifyValidationLink}>
  <ShortCodeScreenStory
    copy={english.auth.shortCode}
    initialModel={{
      journey: "register",
      state: {
        status: "validation-error",
        issues: [
          { field: "newPassword", message: "Choose a new password." },
          { field: "confirmPassword", message: "The passwords do not match." },
        ],
      },
      targetHint: "m•••@example.test",
    }}
  />
</Story>

<Story name="Service error" asChild>
  <ShortCodeScreenStory
    copy={english.auth.shortCode}
    initialModel={{
      journey: "password-reset",
      state: {
        status: "service-error",
        message: "Studio could not verify this secure link. No password was changed.",
      },
    }}
  />
</Story>

<Story name="Success" asChild>
  <ShortCodeScreenStory
    copy={english.auth.shortCode}
    initialModel={{
      journey: "register",
      state: { status: "success", message: "Your account and protected Studio session are ready." },
      targetHint: "m•••@example.test",
    }}
  />
</Story>

<Story name="Narrow French long error" asChild>
  <ShortCodeScreenStory
    copy={french.auth.shortCode}
    frameWidth="22rem"
    initialModel={{
      journey: "email-update",
      state: {
        status: "service-error",
        message:
          "Studio n’a pas pu vérifier cette demande sécurisée pour le moment. L’adresse actuelle du compte demeure inchangée et le lien n’a pas été affiché.",
      },
      targetHint: "n••••••••••••@example.test",
    }}
  />
</Story>
