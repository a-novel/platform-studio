import type { ReadyAccountScreenModel } from "$lib/application/auth/types";
import StudioI18nProvider from "$lib/i18n/StudioI18nProvider.svelte";

import ShortCodeScreen from "../../(standalone)/ext/(short-code)/screen.svelte";
import AccountScreen from "../account/screen.svelte";
import AuthenticationPanel from "./screen.svelte";

import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { page } from "vitest/browser";

import "@a-novel-kit/uikit-fonts/fonts.css";
import "@a-novel-kit/uikit-tokens/tokens.css";

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

function withLocale(locale: "en" | "fr" = "en") {
  return {
    wrapper: StudioI18nProvider,
    wrapperProps: { locale },
  };
}

async function submitForm(buttonName: string): Promise<HTMLFormElement> {
  const buttonLocator = page.getByRole("button", { name: buttonName });
  await expect.element(buttonLocator).toBeVisible();
  const button = buttonLocator.element() as HTMLButtonElement;
  const form = button.form;
  expect(form).not.toBeNull();

  form?.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
  return form as HTMLFormElement;
}

describe("pure authentication screens", () => {
  it("delegates login submission without owning credential state", async () => {
    const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());

    render(
      AuthenticationPanel,
      {
        model: { journey: "login", state: { status: "ready" } },
        action: "/auth?/login",
        onSubmit,
      },
      withLocale()
    );

    const form = await submitForm("Sign in");

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit.mock.calls[0]?.[0]).toBeInstanceOf(SubmitEvent);
    expect(form.getAttribute("action")).toBe("/auth?/login");
    expect(form.getAttribute("method")).toBe("POST");
    await expect.element(page.getByLabelText(/Email address/)).toHaveAttribute("name", "email");
    await expect.element(page.getByLabelText(/Password/)).toHaveAttribute("name", "password");
  });

  it("locks an in-flight login at the pure view boundary", async () => {
    const onSubmit = vi.fn();

    render(
      AuthenticationPanel,
      {
        model: { journey: "login", state: { status: "submitting" } },
        action: "/auth?/login",
        onSubmit,
      },
      withLocale()
    );

    const button = page.getByRole("button", { name: /Signing in/ });
    await expect.element(button).toBeDisabled();
    expect(button.element().querySelector('[role="status"]')).toBeNull();
    await expect.element(page.getByLabelText(/Email address/)).toBeDisabled();
    await expect.element(page.getByLabelText(/Password/)).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("keeps validation feedback beside fields and places service failures before submit", async () => {
    const validation = await render(
      AuthenticationPanel,
      {
        model: {
          journey: "login",
          state: {
            status: "validation-error",
            issues: [
              { field: "email", message: "Enter a valid email address." },
              { field: "password", message: "Enter your password." },
            ],
          },
        },
        action: "/auth?/login",
      },
      withLocale()
    );

    await expect.element(page.getByText("Enter a valid email address.")).toBeVisible();
    await expect.element(page.getByText("Enter your password.")).toBeVisible();
    expect(document.querySelector('a[href$="-email"]')).toBeNull();
    validation.unmount();

    await render(
      AuthenticationPanel,
      {
        model: {
          journey: "login",
          state: { status: "service-error", message: "Authentication is temporarily unavailable." },
        },
        action: "/auth?/login",
      },
      withLocale()
    );

    const alert = page.getByRole("alert").element();
    const submit = page.getByRole("button", { name: "Sign in" }).element();
    expect(alert.compareDocumentPosition(submit) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
    expect(alert.textContent?.trim()).toBe("Authentication is temporarily unavailable.");
  });

  it("shows the complete address the user just submitted without a redundant label", async () => {
    render(
      AuthenticationPanel,
      {
        model: {
          journey: "register",
          state: { status: "pending-email", targetHint: "maya.chen@example.test" },
        },
        action: "/auth?/register",
      },
      withLocale()
    );

    await expect.element(page.getByText("maya.chen@example.test")).toBeVisible();
    await expect.element(page.getByText("Delivery address")).not.toBeInTheDocument();
    expect(
      Array.from(document.querySelectorAll("strong")).some(
        (element) => element.textContent === "maya.chen@example.test"
      )
    ).toBe(true);
  });

  it("keeps account actions independently mockable", async () => {
    const onPasswordSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
    const onEmailSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
    const onLogoutSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());

    render(
      AccountScreen,
      {
        model: readyAccount,
        actions: {
          password: "/account?/password",
          email: "/account?/email",
          logout: "/account?/logout",
        },
        onPasswordSubmit,
        onEmailSubmit,
        onLogoutSubmit,
      },
      withLocale()
    );

    expect((await submitForm("Change password")).getAttribute("action")).toBe("/account?/password");
    expect((await submitForm("Send confirmation link")).getAttribute("action")).toBe("/account?/email");
    expect((await submitForm("Sign out")).getAttribute("action")).toBe("/account?/logout");
    expect(onPasswordSubmit).toHaveBeenCalledOnce();
    expect(onEmailSubmit).toHaveBeenCalledOnce();
    expect(onLogoutSubmit).toHaveBeenCalledOnce();
  });

  it("never renders secure-link material and locks completion while submitting", async () => {
    const onSubmit = vi.fn();

    render(
      ShortCodeScreen,
      {
        model: {
          journey: "password-reset",
          state: { status: "submitting" },
          targetHint: "m•••@example.test",
        },
        action: "/ext/password/reset",
        restartHref: "/?auth=reset",
        continueHref: "/",
        onSubmit,
      },
      withLocale()
    );

    const button = page.getByRole("button", { name: /Resetting password/ });
    await expect.element(button).toBeDisabled();
    expect(button.element().querySelector('[role="status"]')).toBeNull();
    await expect.element(page.getByLabelText(/New password/)).toBeDisabled();
    await expect.element(page.getByLabelText(/Confirm new password/)).toBeDisabled();
    expect(document.querySelector('[name="shortCode"]')).toBeNull();
    expect(document.querySelector('[name="target"]')).toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("renders email confirmation without password controls", async () => {
    const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());

    render(
      ShortCodeScreen,
      {
        model: { journey: "email-update", state: { status: "ready" } },
        action: "/ext/email/validate",
        restartHref: "/account",
        continueHref: "/account",
        onSubmit,
      },
      withLocale()
    );

    const form = await submitForm("Confirm email change");

    expect(form.querySelector('input[type="password"]')).toBeNull();
    expect(onSubmit).toHaveBeenCalledOnce();
  });
});
