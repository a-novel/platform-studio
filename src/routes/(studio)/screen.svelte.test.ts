import type { StudioShellViewModel } from "$lib/application/shell/types";
import StudioI18nProvider from "$lib/i18n/StudioI18nProvider.svelte";

import Screen from "./screen.svelte";

import { beforeEach, describe, expect, it, vi } from "vitest";
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
    const onAuthViewChange = vi.fn();
    render(
      Screen,
      {
        model: model(),
        onAuthViewChange,
      },
      withLocale()
    );

    await expect.element(page.getByRole("main")).toBeVisible();
    await expect.element(page.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
    await page.getByRole("button", { name: "Sign in" }).click();

    expect(onAuthViewChange).toHaveBeenCalledExactlyOnceWith("login");
  });

  it("keeps the collapsed Home destination accessible by name", async () => {
    render(
      Screen,
      {
        model: model({ rail: "collapsed" }),
      },
      withLocale("fr")
    );

    await expect.element(page.getByRole("link", { name: "Accueil" })).toBeVisible();
    await expect
      .element(page.getByRole("button", { name: "Développer la navigation" }))
      .toHaveAttribute("aria-expanded", "false");
  });

  it("links the account name directly and keeps logout visible", async () => {
    const onLogout = vi.fn();
    render(
      Screen,
      {
        model: model({
          session: {
            status: "authenticated",
            displayName: "Maya Chen",
            initials: "MC",
          },
        }),
        accountHref: "/account",
        onLogout,
      },
      withLocale()
    );

    await expect.element(page.getByRole("link", { name: "Maya Chen" })).toHaveAttribute("href", "/account");
    await expect.element(page.getByRole("button", { name: "Log out" })).toBeVisible();

    await page.getByRole("button", { name: "Log out" }).click();
    expect(onLogout).toHaveBeenCalledOnce();
  });

  it("renders URL-controlled auth views and delegates view changes", async () => {
    const onAuthViewChange = vi.fn();
    render(
      Screen,
      {
        model: model({ authView: "register" }),
        onAuthViewChange,
      },
      withLocale()
    );

    await expect.element(page.getByRole("dialog", { name: "Create your account" })).toBeVisible();
    await page.getByRole("button", { name: "Sign in instead" }).click();

    expect(onAuthViewChange).toHaveBeenCalledExactlyOnceWith("login");
  });

  it("presents session errors as a compact status without a retry action", async () => {
    render(
      Screen,
      {
        model: model({
          session: { status: "error" },
        }),
      },
      withLocale()
    );

    await expect.element(page.getByRole("alert")).toHaveTextContent("Account status is temporarily unavailable.");
    await expect.element(page.getByRole("button", { name: /Retry account status/i })).not.toBeInTheDocument();
  });
});
