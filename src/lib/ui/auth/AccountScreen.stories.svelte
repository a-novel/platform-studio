<script module lang="ts">
  import type { ReadyAccountScreenModel } from "$lib/application/auth/types";

  import AccountScreenStory from "./AccountScreenStory.svelte";

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
    tags: ["autodocs"],
    parameters: {
      layout: "fullscreen",
      docs: {
        description: {
          component:
            "Pure account management. Verified claims are shown without fabricating an authoritative email, and every credential action owns an independent serializable state.",
        },
      },
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
    const link = canvas.getByRole("link", { name: "The passwords do not match." });
    await expect(link.getAttribute("href")).toMatch(/-confirm-password$/);
  }

  async function verifyPasswordLocked({ canvasElement }: { canvasElement: HTMLElement }) {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Changing password…" })).toBeDisabled();
    await expect(canvas.getByLabelText(/Current password/)).toBeDisabled();
  }
</script>

<Story name="Ready" asChild play={verifyReadyAccount}>
  <AccountScreenStory initialModel={ready} />
</Story>

<Story name="Loading" asChild>
  <AccountScreenStory initialModel={{ status: "loading" }} />
</Story>

<Story name="Load error" asChild play={verifyLoadRetry}>
  <AccountScreenStory initialModel={{ status: "error", message: "Studio could not verify the current session." }} />
</Story>

<Story name="Password validation error" asChild play={verifyPasswordValidation}>
  <AccountScreenStory
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
  <AccountScreenStory initialModel={{ ...ready, passwordState: { status: "submitting" } }} />
</Story>

<Story name="Password service error" asChild>
  <AccountScreenStory
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
  <AccountScreenStory
    initialModel={{
      ...ready,
      passwordState: { status: "success", message: "Use the new password the next time you sign in." },
    }}
  />
</Story>

<Story name="Email validation error" asChild>
  <AccountScreenStory
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
  <AccountScreenStory initialModel={{ ...ready, emailState: { status: "submitting" } }} />
</Story>

<Story name="Email service error" asChild>
  <AccountScreenStory
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
  <AccountScreenStory
    initialModel={{
      ...ready,
      emailState: { status: "pending-email", targetHint: "n••••••@example.test" },
    }}
  />
</Story>

<Story name="Email success" asChild>
  <AccountScreenStory
    initialModel={{
      ...ready,
      emailState: { status: "success", message: "The verified address now applies to this account." },
    }}
  />
</Story>

<Story name="Logout submitting" asChild>
  <AccountScreenStory initialModel={{ ...ready, logoutState: "submitting" }} />
</Story>

<Story name="Logout error" asChild>
  <AccountScreenStory
    initialModel={{
      ...ready,
      logoutState: { status: "service-error", message: "Studio could not clear the local session." },
    }}
  />
</Story>

<Story name="Narrow French long copy" asChild parameters={{ locale: "fr" }}>
  <AccountScreenStory
    frameWidth="24rem"
    initialModel={{
      ...ready,
      claims: {
        ...ready.claims,
        roles: ["auth:utilisateur", "studio:créateur-de-récits-collaboratifs"],
        accessExpiresAt: "18 août 2026 à 19:30",
        refreshExpiresAt: "25 août 2026 à 18:30",
      },
      emailState: {
        status: "service-error",
        message:
          "Le service d’authentification reste momentanément indisponible. L’adresse actuelle demeure inchangée et aucune information sensible n’a été conservée.",
      },
    }}
  />
</Story>
