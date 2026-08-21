import type {
  AuthenticationPanelModel,
  ReadyAccountScreenModel,
  ShortCodeScreenModel,
} from "$lib/application/auth/types";
import StudioI18nProvider from "$lib/i18n/StudioI18nProvider.svelte";

import { createShortCodeScreenController } from "../../(standalone)/ext/(short-code)/controller.svelte";
import ShortCodeScreen from "../../(standalone)/ext/(short-code)/screen.svelte";
import { createAccountScreenController } from "../account/controller.svelte";
import AccountScreen from "../account/screen.svelte";
import { createAuthenticationPanelController } from "./controller.svelte";
import AuthenticationPanel from "./screen.svelte";

import { describe, expect, it } from "vitest";
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

function authenticationController(model: AuthenticationPanelModel) {
  return createAuthenticationPanelController({
    model,
    action: `/auth?/${model.journey}`,
    allowNativeSubmission: false,
  });
}

function shortCodeController(model: ShortCodeScreenModel) {
  return createShortCodeScreenController({
    model,
    action: "/ext/complete",
    restartHref: "/?auth=reset",
    continueHref: "/",
    allowNativeSubmission: false,
  });
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
    const controller = authenticationController({ journey: "login", state: { status: "ready" } });

    render(AuthenticationPanel, { controller }, withLocale());

    const form = await submitForm("Sign in");

    expect(form.getAttribute("action")).toBe("/auth?/login");
    expect(form.getAttribute("method")).toBe("POST");
    expect(controller.state.model.state.status).toBe("submitting");
    await expect.element(page.getByLabelText(/Email address/)).toHaveAttribute("name", "email");
    await expect.element(page.getByLabelText(/Password/)).toHaveAttribute("name", "password");
  });

  it("locks an in-flight login at the pure view boundary", async () => {
    render(
      AuthenticationPanel,
      {
        controller: authenticationController({ journey: "login", state: { status: "submitting" } }),
      },
      withLocale()
    );

    const button = page.getByRole("button", { name: /Signing in/ });
    await expect.element(button).toBeDisabled();
    expect(button.element().querySelector('[role="status"]')).toBeNull();
    await expect.element(page.getByLabelText(/Email address/)).toBeDisabled();
    await expect.element(page.getByLabelText(/Password/)).toBeDisabled();
  });

  it("keeps validation feedback beside fields and places service failures before submit", async () => {
    const validation = await render(
      AuthenticationPanel,
      {
        controller: authenticationController({
          journey: "login",
          state: {
            status: "validation-error",
            issues: [
              { field: "email", feedback: "email" },
              { field: "password", feedback: "password" },
            ],
          },
        }),
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
        controller: authenticationController({
          journey: "login",
          state: { status: "service-error", feedback: "serviceUnavailable" },
        }),
      },
      withLocale()
    );

    const alert = page.getByRole("alert").element();
    const submit = page.getByRole("button", { name: "Sign in" }).element();
    expect(alert.compareDocumentPosition(submit) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
    expect(alert.textContent?.trim()).toBe("The authentication service is temporarily unavailable. Try again.");
  });

  it("translates stable feedback codes through the active locale", async () => {
    const validation = await render(
      AuthenticationPanel,
      {
        controller: authenticationController({
          journey: "login",
          state: {
            status: "validation-error",
            issues: [
              { field: "email", feedback: "email" },
              { field: "password", feedback: "password" },
            ],
          },
        }),
      },
      withLocale("fr")
    );

    await expect.element(page.getByText("Saisissez une adresse e-mail valide.")).toBeVisible();
    await expect.element(page.getByText("Saisissez votre mot de passe.")).toBeVisible();
    validation.unmount();

    render(
      AuthenticationPanel,
      {
        controller: authenticationController({
          journey: "login",
          state: { status: "service-error", feedback: "invalidCredentials" },
        }),
      },
      withLocale("fr")
    );

    await expect.element(page.getByText("L’adresse e-mail ou le mot de passe est incorrect.")).toBeVisible();
  });

  it("shows the complete address the user just submitted without a redundant label", async () => {
    render(
      AuthenticationPanel,
      {
        controller: authenticationController({
          journey: "register",
          state: { status: "pending-email", targetHint: "maya.chen@example.test" },
        }),
      },
      withLocale()
    );

    const status = page.getByRole("status");
    await expect.element(status).toBeVisible();
    expect(getComputedStyle(status.element()).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    await expect.element(page.getByText("maya.chen@example.test")).toBeVisible();
    await expect.element(page.getByText("Delivery address")).not.toBeInTheDocument();
    expect(
      Array.from(document.querySelectorAll("strong")).some(
        (element) => element.textContent === "maya.chen@example.test"
      )
    ).toBe(true);
  });

  it("keeps account actions independently mockable", async () => {
    const controller = createAccountScreenController({
      model: readyAccount,
      actions: {
        password: "/account?/password",
        email: "/account?/email",
        logout: "/account?/logout",
      },
      allowNativeSubmission: false,
    });

    render(AccountScreen, { controller }, withLocale());

    expect((await submitForm("Change password")).getAttribute("action")).toBe("/account?/password");
    expect((await submitForm("Send confirmation link")).getAttribute("action")).toBe("/account?/email");
    expect((await submitForm("Sign out")).getAttribute("action")).toBe("/account?/logout");
    expect(controller.state.model).toMatchObject({
      status: "ready",
      passwordState: { status: "submitting" },
      emailState: { status: "submitting" },
      logoutState: "submitting",
    });
  });

  it("never renders secure-link material and locks completion while submitting", async () => {
    render(
      ShortCodeScreen,
      {
        controller: shortCodeController({
          journey: "password-reset",
          state: { status: "submitting" },
        }),
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
  });

  it("renders email confirmation without password controls", async () => {
    const controller = createShortCodeScreenController({
      model: { journey: "email-update", state: { status: "ready" } },
      action: "/ext/email/validate",
      restartHref: "/account",
      continueHref: "/account",
      allowNativeSubmission: false,
    });

    render(ShortCodeScreen, { controller }, withLocale());

    const submitLocator = page.getByRole("button", { name: "Confirm email change" });
    await expect.element(submitLocator).toBeVisible();
    const submit = submitLocator.element();
    const form = await submitForm("Confirm email change");

    expect(form.querySelector('input[type="password"]')).toBeNull();
    expect(getComputedStyle(submit).marginBlockStart).toBe("8px");
    expect(controller.state.model.state.status).toBe("submitting");
  });
});
