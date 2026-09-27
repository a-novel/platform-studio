import type { AuthenticationPanelModel } from "$lib/application/auth/types";
import type { StudioShellViewModel } from "$lib/application/shell/types";
import StudioI18nProvider from "$lib/i18n/StudioI18nProvider.svelte";

import { createAuthenticationPanelController } from "./(authentication)/controller.svelte";
import { createStudioShellController, readyAuthenticationModel } from "./controller.svelte";
import Screen from "./screen.svelte";

import { beforeEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { page } from "vitest/browser";

import "@a-novel-kit/uikit-fonts/fonts.css";
import "@a-novel-kit/uikit-tokens/tokens.css";

function model(patch: Partial<StudioShellViewModel> = {}): StudioShellViewModel {
  return {
    activeNavigation: "home",
    authView: null,
    drawerOpen: false,
    rail: "expanded",
    session: { status: "anonymous" },
    ...patch,
  };
}

function controller(
  patch: Partial<StudioShellViewModel> = {},
  options: { authenticationModel?: AuthenticationPanelModel; lockAuthentication?: boolean } = {}
) {
  const shellModel = model(patch);
  const authentication = createAuthenticationPanelController({
    model: options.authenticationModel ?? readyAuthenticationModel(shellModel.authView ?? "login"),
    action: "/auth",
    allowNativeSubmission: false,
  });

  return createStudioShellController({
    model: shellModel,
    homeHref: "/",
    accountHref: "/account",
    logoutAction: "/auth/logout",
    authentication,
    resolveAuthentication: (view) => ({ model: readyAuthenticationModel(view), action: "/auth" }),
    lockAuthentication: options.lockAuthentication,
    allowNativeLogout: false,
  });
}

function withLocale(locale: "en" | "fr" = "en") {
  return {
    wrapper: StudioI18nProvider,
    wrapperProps: { locale },
  };
}

describe("studio shell screen", () => {
  beforeEach(async () => {
    await page.viewport(1280, 800);
  });

  it("exposes the empty workspace, current Home destination, and anonymous authentication action", async () => {
    const shell = controller();
    render(Screen, { controller: shell }, withLocale());

    await expect.element(page.getByRole("main")).toBeVisible();
    await expect.element(page.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
    await expect.element(page.getByRole("img", { name: "Studio" })).toHaveAttribute("width", "128");
    const signIn = page.getByRole("button", { name: "Login" });
    expect(getComputedStyle(signIn.element()).justifyContent).toBe("flex-start");
    await signIn.click();

    expect(shell.state.model.authView).toBe("login");
  });

  it("keeps the collapsed Home destination accessible by name", async () => {
    render(
      Screen,
      {
        controller: controller({ rail: "collapsed" }),
      },
      withLocale("fr")
    );

    await expect.element(page.getByRole("link", { name: "Accueil" })).toBeVisible();
    await expect.element(page.getByRole("img", { name: "Studio" })).toHaveAttribute("width", "24");
    await expect
      .element(page.getByRole("button", { name: "Développer la navigation" }))
      .toHaveAttribute("aria-expanded", "false");
  });

  it("links the account name directly and keeps logout visible", async () => {
    const shell = controller({
      session: {
        status: "authenticated",
        displayName: "Maya Chen",
        initials: "MC",
      },
    });
    render(
      Screen,
      {
        controller: shell,
      },
      withLocale()
    );

    const accountLink = page.getByRole("link", { name: "Maya Chen" });
    await expect.element(accountLink).toHaveAttribute("href", "/account");
    expect(getComputedStyle(accountLink.element()).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(getComputedStyle(accountLink.element()).borderTopStyle).toBe("none");
    await expect.element(page.getByRole("button", { name: "Log out" })).toBeVisible();
    await expect.element(page.getByRole("button", { name: "Login" })).not.toBeInTheDocument();

    await page.getByRole("button", { name: "Log out" }).click();
    expect(shell.state.model.session.status).toBe("anonymous");
  });

  it.each([320, 390, 767])("keeps mobile branding and controls aligned at %ipx", async (width) => {
    await page.viewport(width, 844);
    render(Screen, { controller: controller({ rail: "collapsed" }) }, withLocale());

    const logo = page.getByRole("img", { name: "Studio" });
    await expect.element(logo).toHaveAttribute("width", "128");
    const logoBounds = logo.element().getBoundingClientRect();
    const source = logo.element().getAttribute("src");
    const open = page.getByRole("button", { name: "Open navigation" });
    const controlBounds = open.element().getBoundingClientRect();
    expect(logoBounds.left).toBeGreaterThanOrEqual(16);
    expect(controlBounds.left).toBeGreaterThan(logoBounds.right);
    expect(
      Math.abs(logoBounds.top + logoBounds.height / 2 - controlBounds.top - controlBounds.height / 2)
    ).toBeLessThanOrEqual(1);

    await open.click();
    const menu = page.getByRole("dialog", { name: "Studio" });
    const menuLogo = menu.getByRole("img", { name: "Studio" });
    await expect.element(menuLogo).toHaveAttribute("src", source);
    const menuLogoBounds = menuLogo.element().getBoundingClientRect();
    const closeBounds = menu.getByRole("button", { name: "Close navigation" }).element().getBoundingClientRect();
    for (const key of ["x", "y", "width", "height"] as const) {
      expect(menuLogoBounds[key]).toBeCloseTo(logoBounds[key], 0);
      expect(closeBounds[key]).toBeCloseTo(controlBounds[key], 0);
    }
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(width);
  });

  it("aligns mobile drawer labels and contains a long account name", async () => {
    await page.viewport(390, 844);
    const displayName = "Alexandrine de la Bibliothèque des Mondes Imaginaires";
    render(
      Screen,
      {
        controller: controller({
          drawerOpen: true,
          session: {
            status: "authenticated",
            displayName,
            initials: "AB",
          },
        }),
      },
      withLocale()
    );

    const navigation = page.getByRole("dialog", { name: "Studio" });
    await expect.element(navigation).toBeVisible();

    const accountName = navigation.getByText(displayName).element();
    const labelStarts = [
      navigation.getByText("Home").element().getBoundingClientRect().left,
      accountName.getBoundingClientRect().left,
      navigation.getByText("Log out").element().getBoundingClientRect().left,
    ];

    expect(Math.max(...labelStarts) - Math.min(...labelStarts)).toBeLessThanOrEqual(1);
    expect(accountName.scrollWidth).toBeGreaterThan(accountName.clientWidth);
  });

  it("renders URL-controlled auth views and delegates view changes", async () => {
    const shell = controller({ authView: "register" });
    render(Screen, { controller: shell }, withLocale());

    const registrationDialog = page.getByRole("dialog", { name: "Create your account" });
    await expect.element(registrationDialog).toBeVisible();
    await registrationDialog.getByRole("button", { name: "Login" }).click();

    expect(shell.state.model.authView).toBe("login");
  });

  it("keeps a review dialog open when its controller rejects dismissal", async () => {
    const shell = controller({ authView: "login" }, { lockAuthentication: true });
    render(Screen, { controller: shell }, withLocale());

    await page.getByRole("button", { name: "Close dialog" }).click();

    expect(shell.state.model.authView).toBe("login");
    await expect.element(page.getByRole("dialog", { name: "Login" })).toBeVisible();
  });

  it("omits journey actions from completed authentication dialogs", async () => {
    render(
      Screen,
      {
        controller: controller(
          { authView: "register" },
          {
            authenticationModel: {
              journey: "register",
              state: { status: "pending-email", targetHint: "maya.chen@example.test" },
            },
          }
        ),
      },
      withLocale()
    );

    const registrationDialog = page.getByRole("dialog", { name: "Create your account" });
    await expect.element(registrationDialog).toBeVisible();
    await expect.element(registrationDialog.getByRole("button", { name: "Login" })).not.toBeInTheDocument();
  });

  it("presents session errors as a compact status without a retry action", async () => {
    render(
      Screen,
      {
        controller: controller({
          session: { status: "error" },
        }),
      },
      withLocale()
    );

    await expect.element(page.getByRole("alert")).toHaveTextContent("Account details are unavailable.");
    await expect.element(page.getByRole("button", { name: /Retry account status/i })).not.toBeInTheDocument();
  });
});
