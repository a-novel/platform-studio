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
    const signIn = page.getByRole("button", { name: "Sign in" });
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
    await expect.element(page.getByRole("button", { name: "Sign in" })).not.toBeInTheDocument();

    await page.getByRole("button", { name: "Log out" }).click();
    expect(shell.state.model.session.status).toBe("anonymous");
  });

  it("renders URL-controlled auth views and delegates view changes", async () => {
    const shell = controller({ authView: "register" });
    render(Screen, { controller: shell }, withLocale());

    await expect.element(page.getByRole("dialog", { name: "Create your account" })).toBeVisible();
    await page.getByRole("button", { name: "Sign in instead" }).click();

    expect(shell.state.model.authView).toBe("login");
  });

  it("keeps a review dialog open when its controller rejects dismissal", async () => {
    const shell = controller({ authView: "login" }, { lockAuthentication: true });
    render(Screen, { controller: shell }, withLocale());

    await page.getByRole("button", { name: "Close authentication" }).click();

    expect(shell.state.model.authView).toBe("login");
    await expect.element(page.getByRole("dialog", { name: "Sign in" })).toBeVisible();
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

    await expect.element(page.getByRole("dialog", { name: "Create your account" })).toBeVisible();
    await expect.element(page.getByRole("button", { name: "Sign in instead" })).not.toBeInTheDocument();
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

    await expect.element(page.getByRole("alert")).toHaveTextContent("Account status is temporarily unavailable.");
    await expect.element(page.getByRole("button", { name: /Retry account status/i })).not.toBeInTheDocument();
  });
});
