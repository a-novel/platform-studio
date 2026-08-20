<script module lang="ts">
  import type { ReadyAccountScreenModel } from "$lib/application/auth/types";

  import StoryHarness from "./story.svelte";

  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { expect, userEvent, within } from "storybook/test";

  const ready: ReadyAccountScreenModel = {
    status: "ready",
    claims: {
      userId: "2f798f4a-0694-4f68-9928-42f3e906e871",
      roles: ["auth:user", "studio:creator"],
      accessExpiresAt: "18 Aug 2026, 19:30",
      refreshExpiresAt: "25 Aug 2026, 18:30",
    },
    passwordState: { status: "ready" },
    emailState: { status: "ready" },
    logoutState: "ready",
  };

  const { Story } = defineMeta({
    title: "Authentication/Account screen",
    tags: ["!autodocs"],
    parameters: {
      layout: "fullscreen",
    },
  });

  async function verifyReadyAccount({ canvasElement }: { canvasElement: HTMLElement }) {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "Manage account", level: 1 })).toBeVisible();
    await expect(canvas.getByText("2f798f4a-0694-4f68-9928-42f3e906e871")).toBeVisible();
    await expect(canvas.getByRole("textbox", { name: "New email address" })).toBeVisible();
  }

  async function verifyLoadRetry({ canvasElement }: { canvasElement: HTMLElement }) {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Try again" }));
    await expect(canvas.getByText("Studio is checking the current session.")).toBeVisible();
  }

  async function verifyPasswordValidation({ canvasElement }: { canvasElement: HTMLElement }) {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Enter the current password.")).toBeVisible();
    await expect(canvas.getByText("The passwords do not match.")).toBeVisible();
    await expect(canvas.queryByRole("link", { name: "The passwords do not match." })).not.toBeInTheDocument();
  }

  async function verifyPasswordLocked({ canvasElement }: { canvasElement: HTMLElement }) {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Changing password…" })).toBeDisabled();
    await expect(canvas.getByLabelText(/Current password/)).toBeDisabled();
  }
</script>

<Story name="Ready" asChild play={verifyReadyAccount}>
  <StoryHarness initialModel={ready} />
</Story>

<Story name="Loading" asChild>
  <StoryHarness initialModel={{ status: "loading" }} />
</Story>

<Story name="Load error" asChild play={verifyLoadRetry}>
  <StoryHarness initialModel={{ status: "error", message: "Studio could not verify the current session." }} />
</Story>

<Story name="Password validation error" asChild play={verifyPasswordValidation}>
  <StoryHarness
    initialModel={{
      ...ready,
      passwordState: {
        status: "validation-error",
        issues: [
          { field: "currentPassword", message: "Enter the current password." },
          { field: "confirmPassword", message: "The passwords do not match." },
        ],
      },
    }}
  />
</Story>

<Story name="Password submitting" asChild play={verifyPasswordLocked}>
  <StoryHarness initialModel={{ ...ready, passwordState: { status: "submitting" } }} />
</Story>

<Story name="Password service error" asChild>
  <StoryHarness
    initialModel={{
      ...ready,
      passwordState: {
        status: "service-error",
        message: "The current password was not accepted. No credential was changed.",
      },
    }}
  />
</Story>

<Story name="Password success" asChild>
  <StoryHarness
    initialModel={{
      ...ready,
      passwordState: { status: "success", message: "Use the new password the next time you sign in." },
    }}
  />
</Story>

<Story name="Email validation error" asChild>
  <StoryHarness
    initialModel={{
      ...ready,
      emailState: {
        status: "validation-error",
        issues: [{ field: "newEmail", message: "Enter a valid new email address." }],
      },
    }}
  />
</Story>

<Story name="Email submitting" asChild>
  <StoryHarness initialModel={{ ...ready, emailState: { status: "submitting" } }} />
</Story>

<Story name="Email service error" asChild>
  <StoryHarness
    initialModel={{
      ...ready,
      emailState: {
        status: "service-error",
        message: "Studio could not request a confirmation link. The current address is unchanged.",
      },
    }}
  />
</Story>

<Story name="Email confirmation pending" asChild>
  <StoryHarness
    initialModel={{
      ...ready,
      emailState: { status: "pending-email", targetHint: "new.address@example.test" },
    }}
  />
</Story>

<Story name="Email success" asChild>
  <StoryHarness
    initialModel={{
      ...ready,
      emailState: { status: "success", message: "The verified address now applies to this account." },
    }}
  />
</Story>

<Story name="Logout submitting" asChild>
  <StoryHarness initialModel={{ ...ready, logoutState: "submitting" }} />
</Story>

<Story name="Logout error" asChild>
  <StoryHarness
    initialModel={{
      ...ready,
      logoutState: { status: "service-error", message: "Studio could not clear the local session." },
    }}
  />
</Story>

<Story name="Narrow long content" asChild>
  <StoryHarness
    frameWidth="24rem"
    initialModel={{
      ...ready,
      claims: {
        ...ready.claims,
        roles: ["auth:user", "studio:collaborative-story-creator"],
        accessExpiresAt: "18 September 2026, 19:30",
        refreshExpiresAt: "25 September 2026, 18:30",
      },
      emailState: {
        status: "service-error",
        message:
          "The authentication service is temporarily unavailable. The current address remains unchanged, and no sensitive information was retained.",
      },
    }}
  />
</Story>
