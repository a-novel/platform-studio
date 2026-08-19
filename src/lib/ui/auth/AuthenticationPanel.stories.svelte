<script module lang="ts">
  import type { AuthenticationPanelModel } from "$lib/application/auth/types";
  import { getAuthStoryCopy } from "$lib/i18n/auth-story-copy";

  import AuthenticationDialogStory from "./AuthenticationDialogStory.svelte";

  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { expect, userEvent, within } from "storybook/test";

  const english = getAuthStoryCopy("en");
  const french = getAuthStoryCopy("fr");

  const login: AuthenticationPanelModel = {
    journey: "login",
    state: { status: "ready" },
  };

  const { Story } = defineMeta({
    title: "Authentication/Dialog journeys",
    tags: ["autodocs"],
    parameters: {
      layout: "fullscreen",
      docs: {
        description: {
          component:
            "Pure authentication forms composed inside the real Studio dialog. Models are serializable and callbacks never read, store, or log credentials.",
        },
      },
    },
  });

  async function verifyDialogFocusAndRestoration({ canvasElement }: { canvasElement: HTMLElement }) {
    const canvas = within(canvasElement);
    const email = canvas.getByRole("textbox", { name: "Email address" });
    await expect(email).toHaveFocus();

    await userEvent.click(canvas.getByRole("button", { name: "Close authentication" }));
    const trigger = canvas.getByRole("button", { name: "Sign in" });
    await userEvent.click(trigger);
    await expect(canvas.getByRole("textbox", { name: "Email address" })).toHaveFocus();

    await userEvent.click(canvas.getByRole("button", { name: "Close authentication" }));
    await expect(trigger).toHaveFocus();
  }

  async function verifyValidationLinks({ canvasElement }: { canvasElement: HTMLElement }) {
    const canvas = within(canvasElement);
    const summary = canvas.getByRole("alert", { name: "Check the highlighted fields" });
    await expect(summary).toBeVisible();
    const errorLink = canvas.getByRole("link", { name: "Enter a valid email address." });
    await expect(errorLink.getAttribute("href")).toMatch(/-email$/);
  }

  async function verifySubmittingIsLocked({ canvasElement }: { canvasElement: HTMLElement }) {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Working…" })).toBeDisabled();
    await expect(canvas.getByRole("textbox", { name: "Email address" })).toBeDisabled();
  }
</script>

<Story name="Login ready" asChild play={verifyDialogFocusAndRestoration}>
  <AuthenticationDialogStory authCopy={english.auth.authentication} shellCopy={english.shell} initialModel={login} />
</Story>

<Story name="Login submitting" asChild play={verifySubmittingIsLocked}>
  <AuthenticationDialogStory
    authCopy={english.auth.authentication}
    shellCopy={english.shell}
    initialModel={{ journey: "login", state: { status: "submitting" } }}
  />
</Story>

<Story name="Login validation error" asChild play={verifyValidationLinks}>
  <AuthenticationDialogStory
    authCopy={english.auth.authentication}
    shellCopy={english.shell}
    initialModel={{
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
  <AuthenticationDialogStory
    authCopy={english.auth.authentication}
    shellCopy={english.shell}
    initialModel={{
      journey: "login",
      state: {
        status: "service-error",
        message: "The email or password was not accepted. Check both fields and try again.",
      },
    }}
  />
</Story>

<Story name="Login success" asChild>
  <AuthenticationDialogStory
    authCopy={english.auth.authentication}
    shellCopy={english.shell}
    initialModel={{
      journey: "login",
      state: { status: "success", message: "Your verified Studio session is ready." },
    }}
  />
</Story>

<Story name="Registration request" asChild>
  <AuthenticationDialogStory
    authCopy={english.auth.authentication}
    shellCopy={english.shell}
    initialModel={{ journey: "register", state: { status: "ready" } }}
  />
</Story>

<Story name="Registration email pending" asChild>
  <AuthenticationDialogStory
    authCopy={english.auth.authentication}
    shellCopy={english.shell}
    initialModel={{
      journey: "register",
      state: { status: "pending-email", targetHint: "m•••@example.test" },
    }}
  />
</Story>

<Story name="Password recovery request" asChild>
  <AuthenticationDialogStory
    authCopy={english.auth.authentication}
    shellCopy={english.shell}
    initialModel={{ journey: "reset", state: { status: "ready" } }}
  />
</Story>

<Story name="Password recovery email pending" asChild>
  <AuthenticationDialogStory
    authCopy={english.auth.authentication}
    shellCopy={english.shell}
    initialModel={{
      journey: "reset",
      state: { status: "pending-email", targetHint: "m•••@example.test" },
    }}
  />
</Story>

<Story name="Narrow login" asChild>
  <AuthenticationDialogStory
    authCopy={english.auth.authentication}
    shellCopy={english.shell}
    initialModel={login}
    frameWidth="22rem"
  />
</Story>

<Story name="French long service error" asChild>
  <AuthenticationDialogStory
    authCopy={french.auth.authentication}
    shellCopy={french.shell}
    initialModel={{
      journey: "login",
      state: {
        status: "service-error",
        message:
          "Le service d’authentification reste momentanément indisponible. Vos informations n’ont pas été enregistrées ; vous pouvez réessayer sans risque.",
      },
    }}
  />
</Story>
