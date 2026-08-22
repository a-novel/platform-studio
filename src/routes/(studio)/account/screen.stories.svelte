<script module lang="ts">
  import type { ReadyAccountScreenModel } from "$lib/application/auth/types";
  import { createStorybookTranslator } from "$lib/i18n/storybook";

  import StoryHarness from "./story.svelte";

  import { reviewStoryGlobals } from "@a-novel-kit/uikit-storybook";

  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { expect, within } from "storybook/test";

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

  async function verifyReadyAccount({
    canvasElement,
    globals,
  }: {
    canvasElement: HTMLElement;
    globals: Record<string, unknown>;
  }) {
    const canvas = within(canvasElement);
    const t = createStorybookTranslator(globals);
    await expect(canvas.getByRole("heading", { name: t("authUi.account.title"), level: 1 })).toBeVisible();
    await expect(canvas.getByText("2f798f4a-0694-4f68-9928-42f3e906e871")).toBeVisible();
    await expect(canvas.getByRole("textbox", { name: t("authUi.account.email.label") })).toBeVisible();
  }

  async function verifyPasswordValidation({ canvasElement }: { canvasElement: HTMLElement }) {
    await expect(canvasElement.querySelectorAll('[aria-invalid="true"]')).toHaveLength(2);
    expect(canvasElement.querySelector('a[href$="-confirm-password"]')).toBeNull();
  }

  async function verifyPasswordLocked({
    canvasElement,
    globals,
  }: {
    canvasElement: HTMLElement;
    globals: Record<string, unknown>;
  }) {
    const canvas = within(canvasElement);
    const t = createStorybookTranslator(globals);
    await expect(canvas.getByRole("button", { name: t("authUi.account.password.submitting") })).toBeDisabled();
    await expect(canvas.getByLabelText(t("authUi.account.password.currentLabel"))).toBeDisabled();
  }
</script>

<Story
  name="Ready — desktop"
  exportName="ReadyDesktop"
  globals={reviewStoryGlobals.desktop}
  asChild
  play={verifyReadyAccount}
>
  <StoryHarness initialModel={ready} />
</Story>

<Story name="Ready — mobile" exportName="ReadyMobile" globals={reviewStoryGlobals.mobile} asChild>
  <StoryHarness initialModel={ready} />
</Story>

<Story name="Loading" asChild>
  <StoryHarness initialModel={{ status: "loading" }} />
</Story>

<Story name="Load error" asChild>
  <StoryHarness initialModel={{ status: "error", feedback: "sessionUnavailable" }} />
</Story>

<Story name="Password validation error" asChild play={verifyPasswordValidation}>
  <StoryHarness
    initialModel={{
      ...ready,
      passwordState: {
        status: "validation-error",
        issues: [
          { field: "currentPassword", feedback: "currentPassword" },
          { field: "confirmPassword", feedback: "passwordMismatch" },
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
        feedback: "invalidCurrentPassword",
      },
    }}
  />
</Story>

<Story name="Password success" asChild>
  <StoryHarness
    initialModel={{
      ...ready,
      passwordState: { status: "success", feedback: "passwordChanged" },
    }}
  />
</Story>

<Story name="Email validation error" asChild>
  <StoryHarness
    initialModel={{
      ...ready,
      emailState: {
        status: "validation-error",
        issues: [{ field: "newEmail", feedback: "email" }],
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
        feedback: "serviceUnavailable",
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
      emailState: { status: "success", feedback: "emailUpdated" },
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
      logoutState: { status: "service-error", feedback: "serviceUnavailable" },
    }}
  />
</Story>

<Story name="Long content — mobile" globals={reviewStoryGlobals.mobile} asChild>
  <StoryHarness
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
        feedback: "serviceUnavailable",
      },
    }}
  />
</Story>
