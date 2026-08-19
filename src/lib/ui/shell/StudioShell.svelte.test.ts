import type { StudioShellViewModel } from "$lib/application/shell/types";
import { createRequestI18n } from "$lib/i18n/instance";
import { getStudioShellCopy } from "$lib/i18n/shell-copy";

import StudioShell from "./StudioShell.svelte";

import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { page, userEvent } from "vitest/browser";

import "@a-novel-kit/uikit-fonts/fonts.css";
import "@a-novel-kit/uikit-tokens/tokens.css";

async function shellCopy(locale: "en" | "fr" = "en") {
  const i18n = await createRequestI18n(locale);
  return getStudioShellCopy(i18n.getFixedT(locale, "common"));
}

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

describe("StudioShell", () => {
  beforeEach(async () => {
    await page.viewport(1280, 800);
  });

  it("exposes the empty workspace, current Home destination, and anonymous authentication action", async () => {
    const onAuthViewChange = vi.fn();
    render(StudioShell, {
      copy: await shellCopy(),
      model: model(),
      onAuthViewChange,
    });

    await expect.element(page.getByRole("main")).toBeVisible();
    await expect.element(page.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
    await page.getByRole("button", { name: "Sign in" }).click();

    expect(onAuthViewChange).toHaveBeenCalledExactlyOnceWith("login");
  });

  it("keeps the collapsed Home destination accessible by name", async () => {
    render(StudioShell, {
      copy: await shellCopy("fr"),
      model: model({ rail: "collapsed" }),
    });

    await expect.element(page.getByRole("link", { name: "Accueil" })).toBeVisible();
    await expect
      .element(page.getByRole("button", { name: "Développer la navigation" }))
      .toHaveAttribute("aria-expanded", "false");
  });

  it("supports keyboard account-menu focus and logout", async () => {
    const onLogout = vi.fn();
    render(StudioShell, {
      copy: await shellCopy(),
      model: model({
        session: {
          status: "authenticated",
          displayName: "Maya Chen",
          initials: "MC",
        },
      }),
      onLogout,
    });

    const trigger = page.getByRole("button", { name: "Account menu" });
    trigger.element().focus();
    await userEvent.keyboard("{ArrowDown}");
    await expect.element(page.getByRole("menuitem", { name: "Manage account" })).toHaveFocus();

    await page.getByRole("menuitem", { name: "Log out" }).click();
    expect(onLogout).toHaveBeenCalledOnce();
  });

  it("renders URL-controlled auth views and delegates view changes", async () => {
    const onAuthViewChange = vi.fn();
    render(StudioShell, {
      copy: await shellCopy(),
      model: model({ authView: "register" }),
      onAuthViewChange,
    });

    await expect.element(page.getByRole("dialog", { name: "Create your account" })).toBeVisible();
    await page.getByRole("button", { name: "Sign in instead" }).click();

    expect(onAuthViewChange).toHaveBeenCalledExactlyOnceWith("login");
  });

  it("surfaces session errors and delegates a retry without leaking state into the component", async () => {
    const onRetrySession = vi.fn();
    render(StudioShell, {
      copy: await shellCopy(),
      model: model({
        session: {
          status: "error",
          message: "Account status is temporarily unavailable.",
        },
      }),
      onRetrySession,
    });

    await expect.element(page.getByRole("alert")).toHaveTextContent("Account status is temporarily unavailable.");
    await page.getByRole("button", { name: "Retry account status" }).click();

    expect(onRetrySession).toHaveBeenCalledOnce();
  });
});
