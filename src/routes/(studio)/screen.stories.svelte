<script module lang="ts">
  import type { StudioShellViewModel } from "$lib/application/shell/types";
  import { createStorybookTranslator } from "$lib/i18n/storybook";

  import StoryHarness from "./story.svelte";

  import { reviewStoryGlobals } from "@a-novel-kit/uikit-storybook";

  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { expect, userEvent, within } from "storybook/test";

  const anonymous: StudioShellViewModel = {
    activeNavigation: "home",
    authView: null,
    drawerOpen: false,
    rail: "expanded",
    session: { status: "anonymous" },
  };
  const authenticated: StudioShellViewModel = {
    ...anonymous,
    session: {
      status: "authenticated",
      displayName: "Maya Chen",
      initials: "MC",
    },
  };
  const loadingAccount: StudioShellViewModel = {
    ...anonymous,
    session: { status: "loading" },
  };
  const accountError: StudioShellViewModel = {
    ...anonymous,
    session: { status: "error" },
  };
  const longAccountName: StudioShellViewModel = {
    ...anonymous,
    session: {
      status: "authenticated",
      displayName: "Alexandrine de la Bibliothèque des Mondes Imaginaires",
      initials: "AB",
    },
  };

  function withOpenMobileNavigation(model: StudioShellViewModel): StudioShellViewModel {
    return { ...model, drawerOpen: true };
  }

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

  async function verifyAnonymousAuthentication({
    canvasElement,
    globals,
  }: {
    canvasElement: HTMLElement;
    globals: Record<string, unknown>;
  }) {
    const canvas = within(canvasElement);
    const t = createStorybookTranslator(globals);
    await expect(canvas.getByRole("link", { name: t("shell.home") })).toHaveAttribute("aria-current", "page");

    const signIn = canvas.getByRole("button", { name: t("shell.signIn") });
    await userEvent.click(signIn);
    await expect(canvas.getByRole("dialog", { name: t("shell.auth.login.title") })).toBeVisible();
    const email = await canvas.findByRole("textbox", { name: t("authUi.authentication.emailLabel") });
    await expect(email).toBeVisible();
    await expect(email).toHaveFocus();

    await userEvent.click(canvas.getByRole("button", { name: t("shell.closeAuthentication") }));
    await expect(canvas.queryByRole("dialog", { name: t("shell.auth.login.title") })).not.toBeInTheDocument();

    await userEvent.click(signIn);
    await expect(await canvas.findByRole("textbox", { name: t("authUi.authentication.emailLabel") })).toHaveFocus();
    await userEvent.click(canvas.getByRole("button", { name: t("shell.closeAuthentication") }));
    await expect(signIn).toHaveFocus();
    clearFocus();
  }

  async function verifyRailToggle({
    canvasElement,
    globals,
  }: {
    canvasElement: HTMLElement;
    globals: Record<string, unknown>;
  }) {
    const canvas = within(canvasElement);
    const t = createStorybookTranslator(globals);
    const toggle = canvas.getByRole("button", { name: t("shell.expandNavigation") });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(toggle);
    const collapse = canvas.getByRole("button", { name: t("shell.collapseNavigation") });
    await expect(collapse).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(collapse);
    await expect(canvas.getByRole("button", { name: t("shell.expandNavigation") })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
    clearFocus();
  }

  async function verifyExpandedMobileNavigation({
    canvasElement,
    globals,
  }: {
    canvasElement: HTMLElement;
    globals: Record<string, unknown>;
  }) {
    const canvas = within(canvasElement);
    const t = createStorybookTranslator(globals);
    const navigation = canvas.getByRole("dialog", { name: t("shell.navigation") });
    await expect(navigation).toBeVisible();

    await userEvent.click(within(navigation).getByRole("button", { name: t("shell.closeNavigation") }));
    await expect(navigation).toBeVisible();
    clearFocus();
  }

  async function verifyCollapsedMobileNavigation({
    canvasElement,
    globals,
  }: {
    canvasElement: HTMLElement;
    globals: Record<string, unknown>;
  }) {
    const canvas = within(canvasElement);
    const t = createStorybookTranslator(globals);
    const openNavigation = canvas.getByRole("button", { name: t("shell.openNavigation") });
    await expect(openNavigation).toHaveAttribute("aria-expanded", "false");
    await expect(canvas.queryByRole("dialog", { name: t("shell.navigation") })).not.toBeInTheDocument();

    await userEvent.click(openNavigation);
    const navigation = canvas.getByRole("dialog", { name: t("shell.navigation") });
    await expect(navigation).toBeVisible();

    await userEvent.click(within(navigation).getByRole("button", { name: t("shell.closeNavigation") }));
    await expect(canvas.queryByRole("dialog", { name: t("shell.navigation") })).not.toBeInTheDocument();
    await expect(openNavigation).toHaveAttribute("aria-expanded", "false");
    clearFocus();
  }

  async function verifyAuthenticatedActions({
    canvasElement,
    globals,
  }: {
    canvasElement: HTMLElement;
    globals: Record<string, unknown>;
  }) {
    const canvas = within(canvasElement);
    const t = createStorybookTranslator(globals);
    await expect(canvas.getByRole("link", { name: "Maya Chen" })).toHaveAttribute("href", "/storybook/account");
    await expect(canvas.getByRole("button", { name: t("shell.logout") })).toBeVisible();
    await expect(canvas.queryByRole("button", { name: t("shell.signIn") })).not.toBeInTheDocument();
    clearFocus();
  }

  async function verifyAuthenticatedMobileLayout({
    canvasElement,
    globals,
  }: {
    canvasElement: HTMLElement;
    globals: Record<string, unknown>;
  }) {
    await verifyExpandedMobileNavigation({ canvasElement, globals });

    const canvas = within(canvasElement);
    const t = createStorybookTranslator(globals);
    const navigation = canvas.getByRole("dialog", { name: t("shell.navigation") });
    const labelStarts = [
      within(navigation).getByText(t("shell.home")).getBoundingClientRect().left,
      within(navigation).getByText("Maya Chen").getBoundingClientRect().left,
      within(navigation).getByText(t("shell.logout")).getBoundingClientRect().left,
    ];

    await expect(Math.max(...labelStarts) - Math.min(...labelStarts)).toBeLessThanOrEqual(1);
  }

  async function verifyValidationFeedback({ canvasElement }: { canvasElement: HTMLElement }) {
    await expect(canvasElement.querySelectorAll('[aria-invalid="true"]')).toHaveLength(2);
    expect(canvasElement.querySelector('a[href$="-email"]')).toBeNull();
  }

  async function verifySubmittingIsLocked({
    canvasElement,
    globals,
  }: {
    canvasElement: HTMLElement;
    globals: Record<string, unknown>;
  }) {
    const canvas = within(canvasElement);
    const t = createStorybookTranslator(globals);
    await expect(
      canvas.getByRole("button", { name: t("authUi.authentication.journeys.login.submitting") })
    ).toBeDisabled();
    await expect(canvas.getByRole("textbox", { name: t("authUi.authentication.emailLabel") })).toBeDisabled();
  }

  async function verifyPendingAuthentication({
    canvasElement,
    globals,
  }: {
    canvasElement: HTMLElement;
    globals: Record<string, unknown>;
  }) {
    const canvas = within(canvasElement);
    const t = createStorybookTranslator(globals);
    const status = canvas.getByRole("status");
    const dialog = canvas.getByRole("dialog");
    await expect(status).toBeVisible();
    expect(getComputedStyle(status).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    await expect(within(dialog).queryByRole("button", { name: t("shell.auth.signInInstead") })).not.toBeInTheDocument();
  }
</script>

<Story
  name="Expanded anonymous — desktop"
  exportName="ExpandedAnonymousDesktop"
  globals={reviewStoryGlobals.desktop}
  asChild
  play={verifyAnonymousAuthentication}
>
  <StoryHarness initialModel={anonymous} />
</Story>

<Story
  name="Expanded anonymous — mobile"
  exportName="ExpandedAnonymousMobile"
  globals={reviewStoryGlobals.mobile}
  asChild
  play={verifyExpandedMobileNavigation}
>
  <StoryHarness initialModel={withOpenMobileNavigation(anonymous)} />
</Story>

<Story name="Collapsed anonymous" asChild play={verifyRailToggle}>
  <StoryHarness initialModel={{ ...anonymous, rail: "collapsed" }} />
</Story>

<Story
  name="Collapsed anonymous — mobile"
  exportName="CollapsedAnonymousMobile"
  globals={reviewStoryGlobals.mobile}
  asChild
  play={verifyCollapsedMobileNavigation}
>
  <StoryHarness initialModel={{ ...anonymous, rail: "collapsed" }} />
</Story>

<Story name="Authenticated" asChild play={verifyAuthenticatedActions}>
  <StoryHarness initialModel={authenticated} />
</Story>

<Story
  name="Authenticated — mobile"
  exportName="AuthenticatedMobile"
  globals={reviewStoryGlobals.mobile}
  asChild
  play={verifyAuthenticatedMobileLayout}
>
  <StoryHarness initialModel={withOpenMobileNavigation(authenticated)} />
</Story>

<Story name="Loading account" asChild>
  <StoryHarness initialModel={loadingAccount} />
</Story>

<Story
  name="Loading account — mobile"
  exportName="LoadingAccountMobile"
  globals={reviewStoryGlobals.mobile}
  asChild
  play={verifyExpandedMobileNavigation}
>
  <StoryHarness initialModel={withOpenMobileNavigation(loadingAccount)} />
</Story>

<Story name="Account error" asChild>
  <StoryHarness initialModel={accountError} />
</Story>

<Story
  name="Account error — mobile"
  exportName="AccountErrorMobile"
  globals={reviewStoryGlobals.mobile}
  asChild
  play={verifyExpandedMobileNavigation}
>
  <StoryHarness initialModel={withOpenMobileNavigation(accountError)} />
</Story>

<Story name="Login modal — desktop" exportName="LoginModalDesktop" globals={reviewStoryGlobals.desktop} asChild>
  <StoryHarness initialModel={{ ...anonymous, authView: "login" }} />
</Story>

<Story name="Login modal — mobile" exportName="LoginModalMobile" globals={reviewStoryGlobals.mobile} asChild>
  <StoryHarness initialModel={{ ...anonymous, authView: "login" }} />
</Story>

<Story name="Login submitting" asChild play={verifySubmittingIsLocked}>
  <StoryHarness
    initialModel={{ ...anonymous, authView: "login" }}
    initialAuthenticationModel={{ journey: "login", state: { status: "submitting" } }}
  />
</Story>

<Story name="Login validation error" asChild play={verifyValidationFeedback}>
  <StoryHarness
    initialModel={{ ...anonymous, authView: "login" }}
    initialAuthenticationModel={{
      journey: "login",
      state: {
        status: "validation-error",
        issues: [
          { field: "email", feedback: "email" },
          { field: "password", feedback: "password" },
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
        feedback: "invalidCredentials",
      },
    }}
  />
</Story>

<Story
  name="Registration modal — desktop"
  exportName="RegistrationModalDesktop"
  globals={reviewStoryGlobals.desktop}
  asChild
>
  <StoryHarness initialModel={{ ...anonymous, authView: "register" }} />
</Story>

<Story
  name="Registration modal — mobile"
  exportName="RegistrationModalMobile"
  globals={reviewStoryGlobals.mobile}
  asChild
>
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

<Story
  name="Password reset modal — desktop"
  exportName="PasswordResetModalDesktop"
  globals={reviewStoryGlobals.desktop}
  asChild
>
  <StoryHarness initialModel={{ ...anonymous, authView: "reset" }} />
</Story>

<Story
  name="Password reset modal — mobile"
  exportName="PasswordResetModalMobile"
  globals={reviewStoryGlobals.mobile}
  asChild
>
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

<Story name="Login service unavailable" asChild>
  <StoryHarness
    initialModel={{ ...anonymous, authView: "login" }}
    initialAuthenticationModel={{
      journey: "login",
      state: {
        status: "service-error",
        feedback: "serviceUnavailable",
      },
    }}
  />
</Story>

<Story name="Long account name" asChild>
  <StoryHarness initialModel={longAccountName} />
</Story>

<Story
  name="Long account name — mobile"
  exportName="LongAccountNameMobile"
  globals={reviewStoryGlobals.mobile}
  asChild
  play={verifyExpandedMobileNavigation}
>
  <StoryHarness initialModel={withOpenMobileNavigation(longAccountName)} />
</Story>
