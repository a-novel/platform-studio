import type { AccountScreenModel, AuthenticationPanelModel, ShortCodeScreenModel } from "$lib/application/auth/types";
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

const readyAccount: AccountScreenModel = {
  claims: {
    status: "ready",
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

async function expectFormActionLayout(form: HTMLFormElement) {
  const button = form.querySelector('button[type="submit"]');
  expect(button).not.toBeNull();
  if (!button) return;

  const originalViewport = { width: window.innerWidth, height: window.innerHeight };
  try {
    for (const width of [320, 390, 1280]) {
      await page.viewport(width, 844);
      const bounds = button.getBoundingClientRect();
      const formBounds = form.getBoundingClientRect();
      expect(bounds.left).toBeCloseTo(formBounds.left);
      if (width < 560) expect(bounds.width).toBeCloseTo(formBounds.width);
      else expect(bounds.width).toBeLessThan(formBounds.width);
      const feedback = form.querySelector('[role="alert"]');
      if (feedback) expect(bounds.top - feedback.getBoundingClientRect().bottom).toBe(16);
      const lastInput = Array.from(form.querySelectorAll("input")).at(-1);
      if (lastInput)
        expect(
          (feedback ?? button).getBoundingClientRect().top - lastInput.getBoundingClientRect().bottom
        ).toBeGreaterThanOrEqual(32);
    }
  } finally {
    await page.viewport(originalViewport.width, originalViewport.height);
  }
}

describe("pure authentication screens", () => {
  it("delegates login submission without owning credential state", async () => {
    const controller = authenticationController({ journey: "login", state: { status: "ready" } });

    render(AuthenticationPanel, { controller }, withLocale());

    const form = await submitForm("Login");

    await expectFormActionLayout(form);
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

    const button = page.getByRole("button", { name: /Logging in/ });
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
    const submit = page.getByRole("button", { name: "Login" }).element();
    expect(alert.compareDocumentPosition(submit) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
    expect(alert.textContent?.trim()).toBe("The service is temporarily unavailable. Try again.");
    const form = (submit as HTMLButtonElement).form;
    if (!form) throw new Error("Submit button must belong to a form");
    await expectFormActionLayout(form);
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

    await expect.element(page.getByText("Saisissez un courriel valide.")).toBeVisible();
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

    await expect.element(page.getByText("Le courriel ou le mot de passe est incorrect.")).toBeVisible();
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
    await page.viewport(390, 844);
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

    for (const [label, action] of [
      ["Change password", "/account?/password"],
      ["Send link", "/account?/email"],
      ["Log out", "/account?/logout"],
    ] as const) {
      const form = await submitForm(label);
      expect(form.getAttribute("action")).toBe(action);
      await expectFormActionLayout(form);
      const section = form.closest("section");
      if (!section) throw new Error("Account forms must belong to a section");
      const outer = page.getByRole("region", { name: "Session summary" }).element().getBoundingClientRect();
      const inner = form.getBoundingClientRect();
      expect(outer.left).toBe(8);
      expect(inner.left - outer.left).toBe(16);
      expect(outer.right - inner.right).toBe(16);
      expect(section.getBoundingClientRect().left).toBe(inner.left);
    }
    expect(controller.state.model).toMatchObject({
      passwordState: { status: "submitting" },
      emailState: { status: "submitting" },
      logoutState: "submitting",
    });
  });

  it.each(["loading", "error"] as const)("keeps account forms usable while the recap is %s", async (status) => {
    const controller = createAccountScreenController({
      model: {
        ...readyAccount,
        claims: status === "loading" ? { status } : { status, feedback: "sessionUnavailable" },
      },
      actions: { password: "/account?/password", email: "/account?/email", logout: "/account?/logout" },
      allowNativeSubmission: false,
    });
    render(AccountScreen, { controller }, withLocale());
    const recap = page.getByRole("region", { name: "Session summary" });
    await expect.element(recap).toBeVisible();
    await expect.element(page.getByLabelText(/Current password/)).toBeEnabled();
    await expect.element(page.getByLabelText(/New email address/)).toBeEnabled();
    await page.getByLabelText(/New email address/).fill("creator@example.test");
    await page.getByRole("button", { name: "Send link" }).click();
    await expect.element(page.getByRole("button", { name: /Sending link/ })).toBeDisabled();
    await expect.element(page.getByRole("button", { name: "Change password" })).toBeEnabled();
    await expect.element(page.getByRole("button", { name: "Log out" })).toBeEnabled();
    expect(controller.state.model.claims.status).toBe(status);
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
    const form = (button.element() as HTMLButtonElement).form;
    expect(form).not.toBeNull();
    if (form) await expectFormActionLayout(form);
    expect(button.element().querySelector('[role="status"]')).toBeNull();
    await expect.element(page.getByLabelText(/New password/)).toBeDisabled();
    await expect.element(page.getByLabelText(/Confirm new password/)).toBeDisabled();
    expect(document.querySelector('[name="shortCode"]')).toBeNull();
    expect(document.querySelector('[name="target"]')).toBeNull();
  });

  it("presents secure-link completion as a clear success state", async () => {
    render(
      ShortCodeScreen,
      {
        controller: shortCodeController({
          journey: "register",
          state: { status: "success", feedback: "registrationCompleted" },
        }),
      },
      withLocale()
    );

    const status = page.getByRole("status");
    await expect.element(status).toBeVisible();
    await expect.element(page.getByText("Your account is ready.")).toBeVisible();
    await expect.element(page.getByRole("link", { name: "Continue to Studio" })).toHaveAttribute("href", "/");
    expect(document.querySelector("form")).toBeNull();
    const heading = page.getByRole("heading", { level: 1 }).element();
    expect(getComputedStyle(heading).textAlign).toBe("center");
  });

  it("keeps account and secure-link service errors with their submit actions", async () => {
    const account = await render(
      AccountScreen,
      {
        controller: createAccountScreenController({
          model: {
            ...readyAccount,
            passwordState: { status: "service-error", feedback: "serviceUnavailable" },
            emailState: { status: "service-error", feedback: "serviceUnavailable" },
            logoutState: { status: "service-error", feedback: "serviceUnavailable" },
          },
          actions: { password: "/account?/password", email: "/account?/email", logout: "/account?/logout" },
          allowNativeSubmission: false,
        }),
      },
      withLocale()
    );
    for (const form of document.querySelectorAll("form")) await expectFormActionLayout(form);
    account.unmount();

    await render(
      ShortCodeScreen,
      {
        controller: shortCodeController({
          journey: "password-reset",
          state: { status: "service-error", feedback: "serviceUnavailable" },
        }),
      },
      withLocale()
    );
    for (const form of document.querySelectorAll("form")) await expectFormActionLayout(form);
  });

  it.each(["ready", "submitting"] as const)(
    "renders %s email validation without a confirmation form",
    async (status) => {
      const controller = createShortCodeScreenController({
        model: { journey: "email-update", state: { status } },
        action: "/ext/email/validate",
        restartHref: "/account",
        continueHref: "/account",
        allowNativeSubmission: false,
      });

      render(ShortCodeScreen, { controller }, withLocale());

      await expect.element(page.getByRole("status")).toHaveTextContent("Updating email…");
      await expect.element(page.getByRole("button")).not.toBeInTheDocument();
      expect(document.querySelector('input[type="password"]')).toBeNull();
      expect(controller.state.model.state.status).toBe(status);
    }
  );

  it("renders failed automatic email validation as a page outcome", async () => {
    render(
      ShortCodeScreen,
      {
        controller: shortCodeController({
          journey: "email-update",
          state: { status: "service-error", feedback: "serviceUnavailable" },
        }),
      },
      withLocale()
    );
    await expect.element(page.getByRole("alert")).toHaveTextContent("The service is temporarily unavailable.");
    await expect.element(page.getByRole("link", { name: "Request a new link" })).toBeVisible();
    await expect.element(page.getByRole("button")).not.toBeInTheDocument();
  });
});
