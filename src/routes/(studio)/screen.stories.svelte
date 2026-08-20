<script module lang="ts">
  import type { StudioShellViewModel } from "$lib/application/shell/types";

  import StoryHarness from "./story.svelte";

  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { expect, userEvent, within } from "storybook/test";

  const anonymous: StudioShellViewModel = {
    activeNavigation: "home",
    authView: null,
    drawerOpen: false,
    rail: "expanded",
    session: { status: "anonymous" },
  };

  const { Story } = defineMeta({
    title: "Shell/Platform shell",
    tags: ["!autodocs"],
    parameters: {
      layout: "fullscreen",
    },
  });

  function clearFocus() {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  }

  async function verifyAnonymousAuthentication({ canvasElement }: { canvasElement: HTMLElement }) {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");

    const signIn = canvas.getByRole("button", { name: "Sign in" });
    await userEvent.click(signIn);
    await expect(canvas.getByRole("dialog", { name: "Sign in" })).toBeVisible();
    const email = await canvas.findByRole("textbox", { name: "Email address" });
    await expect(email).toBeVisible();
    await expect(email).toHaveFocus();

    await userEvent.click(canvas.getByRole("button", { name: "Close authentication" }));
    await expect(canvas.queryByRole("dialog", { name: "Sign in" })).not.toBeInTheDocument();

    await userEvent.click(signIn);
    await expect(await canvas.findByRole("textbox", { name: "Email address" })).toHaveFocus();
    await userEvent.click(canvas.getByRole("button", { name: "Close authentication" }));
    await expect(signIn).toHaveFocus();
    clearFocus();
  }

  async function verifyRailToggle({ canvasElement }: { canvasElement: HTMLElement }) {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("button", { name: "Expand navigation" });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(toggle);
    const collapse = canvas.getByRole("button", { name: "Collapse navigation" });
    await expect(collapse).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(collapse);
    await expect(canvas.getByRole("button", { name: "Expand navigation" })).toHaveAttribute("aria-expanded", "false");
    clearFocus();
  }

  async function verifyAuthenticatedActions({ canvasElement }: { canvasElement: HTMLElement }) {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("link", { name: "Maya Chen" })).toHaveAttribute("href", "/storybook/account");
    await expect(canvas.getByRole("button", { name: "Log out" })).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "Sign in" })).not.toBeInTheDocument();
    clearFocus();
  }

  async function verifyValidationLinks({ canvasElement }: { canvasElement: HTMLElement }) {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Enter a valid email address.")).toBeVisible();
    await expect(canvas.getByText("Enter your password.")).toBeVisible();
    await expect(canvas.queryByRole("link", { name: "Enter a valid email address." })).not.toBeInTheDocument();
  }

  async function verifySubmittingIsLocked({ canvasElement }: { canvasElement: HTMLElement }) {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Signing in…" })).toBeDisabled();
    await expect(canvas.getByRole("textbox", { name: "Email address" })).toBeDisabled();
  }

  async function verifyPendingAuthentication({ canvasElement }: { canvasElement: HTMLElement }) {
    const canvas = within(canvasElement);
    const status = canvas.getByRole("status");
    await expect(status).toBeVisible();
    expect(getComputedStyle(status).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    await expect(canvas.queryByRole("button", { name: "Sign in instead" })).not.toBeInTheDocument();
  }
</script>

<Story name="Expanded anonymous" asChild play={verifyAnonymousAuthentication}>
  <StoryHarness initialModel={anonymous} />
</Story>

<Story name="Collapsed anonymous" asChild play={verifyRailToggle}>
  <StoryHarness initialModel={{ ...anonymous, rail: "collapsed" }} />
</Story>

<Story name="Authenticated" asChild play={verifyAuthenticatedActions}>
  <StoryHarness
    initialModel={{
      ...anonymous,
      session: {
        status: "authenticated",
        displayName: "Maya Chen",
        initials: "MC",
      },
    }}
  />
</Story>

<Story name="Loading account" asChild>
  <StoryHarness initialModel={{ ...anonymous, session: { status: "loading" } }} />
</Story>

<Story name="Account error" asChild>
  <StoryHarness
    initialModel={{
      ...anonymous,
      session: { status: "error" },
    }}
  />
</Story>

<Story name="Login modal" asChild>
  <StoryHarness initialModel={{ ...anonymous, authView: "login" }} />
</Story>

<Story name="Login submitting" asChild play={verifySubmittingIsLocked}>
  <StoryHarness
    initialModel={{ ...anonymous, authView: "login" }}
    initialAuthenticationModel={{ journey: "login", state: { status: "submitting" } }}
  />
</Story>

<Story name="Login validation error" asChild play={verifyValidationLinks}>
  <StoryHarness
    initialModel={{ ...anonymous, authView: "login" }}
    initialAuthenticationModel={{
      journey: "login",
      state: {
        status: "validation-error",
        issues: [
          { field: "email", message: "Enter a valid email address." },
          { field: "password", message: "Enter your password." },
        ],
      },
    }}
  />
</Story>

<Story name="Login service error" asChild>
  <StoryHarness
    initialModel={{ ...anonymous, authView: "login" }}
    initialAuthenticationModel={{
      journey: "login",
      state: {
        status: "service-error",
        message: "The email or password was not accepted. Check both fields and try again.",
      },
    }}
  />
</Story>

<Story name="Registration modal" asChild>
  <StoryHarness initialModel={{ ...anonymous, authView: "register" }} />
</Story>

<Story name="Registration email pending" asChild play={verifyPendingAuthentication}>
  <StoryHarness
    initialModel={{ ...anonymous, authView: "register" }}
    initialAuthenticationModel={{
      journey: "register",
      state: { status: "pending-email", targetHint: "maya.chen@example.test" },
    }}
  />
</Story>

<Story name="Password reset modal" asChild>
  <StoryHarness initialModel={{ ...anonymous, authView: "reset" }} />
</Story>

<Story name="Password reset email pending" asChild>
  <StoryHarness
    initialModel={{ ...anonymous, authView: "reset" }}
    initialAuthenticationModel={{
      journey: "reset",
      state: { status: "pending-email", targetHint: "maya.chen@example.test" },
    }}
  />
</Story>

<Story name="Narrow login modal" asChild>
  <StoryHarness frameWidth="22rem" initialModel={{ ...anonymous, authView: "login" }} />
</Story>

<Story name="Long login error" asChild>
  <StoryHarness
    initialModel={{ ...anonymous, authView: "login" }}
    initialAuthenticationModel={{
      journey: "login",
      state: {
        status: "service-error",
        message:
          "The authentication service is taking longer than expected to respond. Your credentials were not saved, and you can safely try again.",
      },
    }}
  />
</Story>

<Story name="Long account name" asChild>
  <StoryHarness
    initialModel={{
      ...anonymous,
      session: {
        status: "authenticated",
        displayName: "Alexandrine de la Bibliothèque des Mondes Imaginaires",
        initials: "AB",
      },
    }}
  />
</Story>
