import AccountScreen from "./AccountScreen.svelte";
import AuthenticationPanel from "./AuthenticationPanel.svelte";
import ShortCodeScreen from "./ShortCodeScreen.svelte";
import { getAuthStoryCopy } from "./story-copy";
import type { ReadyAccountScreenModel } from "./types";

import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { page } from "vitest/browser";

import "@a-novel-kit/uikit-fonts/fonts.css";
import "@a-novel-kit/uikit-tokens/tokens.css";

const copy = getAuthStoryCopy("en").auth;

const readyAccount: ReadyAccountScreenModel = {
  status: "ready",
  claims: {
    userId: "verified-user-id",
    roles: ["auth:user"],
    accessExpiresAt: "18 Aug 2026, 19:30",
    refreshExpiresAt: "25 Aug 2026, 18:30",
  },
  passwordState: { status: "ready" },
  emailState: { status: "ready" },
  logoutState: "ready",
};

function submitForm(buttonName: string): HTMLFormElement {
  const button = page.getByRole("button", { name: buttonName }).element() as HTMLButtonElement;
  const form = button.form;
  expect(form).not.toBeNull();

  form?.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
  return form as HTMLFormElement;
}

describe("pure authentication screens", () => {
  it("delegates login submission without owning credential state", async () => {
    const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());

    render(AuthenticationPanel, {
      copy: copy.authentication,
      model: { journey: "login", state: { status: "ready" } },
      action: "/auth?/login",
      onSubmit,
    });

    const form = submitForm("Sign in");

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit.mock.calls[0]?.[0]).toBeInstanceOf(SubmitEvent);
    expect(form.getAttribute("action")).toBe("/auth?/login");
    expect(form.getAttribute("method")).toBe("POST");
    await expect.element(page.getByLabelText(/Email address/)).toHaveAttribute("name", "email");
    await expect.element(page.getByLabelText(/Password/)).toHaveAttribute("name", "password");
  });

  it("locks an in-flight login at the pure view boundary", async () => {
    const onSubmit = vi.fn();

    render(AuthenticationPanel, {
      copy: copy.authentication,
      model: { journey: "login", state: { status: "submitting" } },
      action: "/auth?/login",
      onSubmit,
    });

    await expect.element(page.getByRole("button")).toBeDisabled();
    await expect.element(page.getByLabelText(/Email address/)).toBeDisabled();
    await expect.element(page.getByLabelText(/Password/)).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("keeps account actions independently mockable", () => {
    const onPasswordSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
    const onEmailSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
    const onLogoutSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());

    render(AccountScreen, {
      copy: copy.account,
      model: readyAccount,
      actions: {
        password: "/account?/password",
        email: "/account?/email",
        logout: "/account?/logout",
      },
      onPasswordSubmit,
      onEmailSubmit,
      onLogoutSubmit,
    });

    expect(submitForm("Change password").getAttribute("action")).toBe("/account?/password");
    expect(submitForm("Send confirmation link").getAttribute("action")).toBe("/account?/email");
    expect(submitForm("Sign out").getAttribute("action")).toBe("/account?/logout");
    expect(onPasswordSubmit).toHaveBeenCalledOnce();
    expect(onEmailSubmit).toHaveBeenCalledOnce();
    expect(onLogoutSubmit).toHaveBeenCalledOnce();
  });

  it("never renders secure-link material and locks completion while submitting", async () => {
    const onSubmit = vi.fn();

    render(ShortCodeScreen, {
      copy: copy.shortCode,
      model: {
        journey: "password-reset",
        state: { status: "submitting" },
        targetHint: "m•••@example.test",
      },
      action: "/ext/password/reset",
      homeHref: "/",
      restartHref: "/?auth=reset",
      continueHref: "/",
      onSubmit,
    });

    await expect.element(page.getByRole("button")).toBeDisabled();
    await expect.element(page.getByLabelText(/New password/)).toBeDisabled();
    await expect.element(page.getByLabelText(/Confirm new password/)).toBeDisabled();
    expect(document.querySelector('[name="shortCode"]')).toBeNull();
    expect(document.querySelector('[name="target"]')).toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("renders email confirmation without password controls", () => {
    const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());

    render(ShortCodeScreen, {
      copy: copy.shortCode,
      model: { journey: "email-update", state: { status: "ready" } },
      action: "/ext/email/validate",
      homeHref: "/",
      restartHref: "/account",
      continueHref: "/account",
      onSubmit,
    });

    const form = submitForm("Confirm email change");

    expect(form.querySelector('input[type="password"]')).toBeNull();
    expect(onSubmit).toHaveBeenCalledOnce();
  });
});
