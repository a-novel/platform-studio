import { createStudioI18n } from "$lib/i18n/instance";

import {
  type ShortCodeClient,
  type ShortCodeCompletionContext,
  completeShortCode,
  readShortCodeModel,
} from "./short-code";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { HttpError } from "@a-novel-kit/nodelib-browser/http";

const t = createStudioI18n("en").getFixedT("en", "common");

const userId = "140f24ee-1531-4a9d-ace8-20b38e1b21bc";

function encoded(value: string): string {
  return Buffer.from(value).toString("base64url");
}

function registrationUrl(): URL {
  return new URL("https://studio.test/ext/account/create?shortCode=code-123&target=" + encoded("creator@example.com"));
}

function passwordForm(value = "replacement-password"): FormData {
  const form = new FormData();
  form.set("password", value);
  form.set("confirmPassword", value);
  return form;
}

function createContext() {
  const client = {
    register: vi.fn<ShortCodeClient["register"]>(),
    resetPassword: vi.fn<ShortCodeClient["resetPassword"]>(),
    updateEmail: vi.fn<ShortCodeClient["updateEmail"]>(),
  };
  const accessToken = vi.fn<ShortCodeCompletionContext["accessToken"]>();
  const accept = vi.fn<ShortCodeCompletionContext["accept"]>();
  const rememberIdentity = vi.fn<ShortCodeCompletionContext["rememberIdentity"]>();

  accessToken.mockResolvedValue("anonymous-access");

  return {
    context: { accept, accessToken, client, rememberIdentity } satisfies ShortCodeCompletionContext,
    mocks: { accept, accessToken, rememberIdentity, ...client },
  };
}

describe("readShortCodeModel", () => {
  it("returns display-only state without raw link credentials", () => {
    const model = readShortCodeModel("register", registrationUrl(), t("authFlow.feedback.registrationCompleted"));

    expect(model).toEqual({
      journey: "register",
      state: { status: "ready" },
    });
    expect(JSON.stringify(model)).not.toContain("code-123");
    expect(JSON.stringify(model)).not.toContain("creator@example.com");
  });

  it("supports clean shareable result URLs", () => {
    expect(
      readShortCodeModel(
        "password-reset",
        new URL("https://studio.test/ext/password/reset?result=success"),
        t("authFlow.feedback.passwordReset")
      )
    ).toEqual({
      journey: "password-reset",
      state: { status: "success", message: t("authFlow.feedback.passwordReset") },
    });
  });
});

describe("completeShortCode", () => {
  let setup: ReturnType<typeof createContext>;

  beforeEach(() => {
    setup = createContext();
  });

  it("validates passwords before requesting an anonymous token", async () => {
    const result = await completeShortCode(
      "register",
      registrationUrl(),
      passwordForm(""),
      t,
      t("authFlow.feedback.serviceUnavailable"),
      t("authFlow.feedback.registrationCompleted"),
      setup.context
    );

    expect(result.outcome).toBe("validation-error");
    expect(setup.mocks.accessToken).not.toHaveBeenCalled();
    expect(setup.mocks.register).not.toHaveBeenCalled();
  });

  it("creates an account and stores only the returned session", async () => {
    setup.mocks.register.mockResolvedValue({
      accessToken: "new-access",
      refreshToken: "new-refresh",
    });

    const result = await completeShortCode(
      "register",
      registrationUrl(),
      passwordForm(),
      t,
      t("authFlow.feedback.serviceUnavailable"),
      t("authFlow.feedback.registrationCompleted"),
      setup.context
    );

    expect(result.outcome).toBe("success");
    expect(setup.mocks.register).toHaveBeenCalledWith("anonymous-access", {
      email: "creator@example.com",
      password: "replacement-password",
      shortCode: "code-123",
    });
    expect(setup.mocks.accept).toHaveBeenCalledWith(
      {
        accessToken: "new-access",
        refreshToken: "new-refresh",
      },
      "creator@example.com"
    );
    expect(JSON.stringify(result.model)).not.toContain("code-123");
    expect(JSON.stringify(result.model)).not.toContain("replacement-password");
  });

  it("confirms an email update without collecting a password", async () => {
    const url = new URL(
      "https://studio.test/ext/email/validate?shortCode=code-123&target=" +
        userId +
        "&source=" +
        encoded("new@example.com")
    );

    const result = await completeShortCode(
      "email-update",
      url,
      new FormData(),
      t,
      t("authFlow.feedback.serviceUnavailable"),
      t("authFlow.feedback.emailUpdated"),
      setup.context
    );

    expect(result.outcome).toBe("success");
    expect(setup.mocks.updateEmail).toHaveBeenCalledWith("anonymous-access", {
      shortCode: "code-123",
      userID: userId,
    });
    expect(setup.mocks.rememberIdentity).toHaveBeenCalledWith("new@example.com");
  });

  it("resets a password with the parsed account target", async () => {
    const url = new URL("https://studio.test/ext/password/reset?shortCode=code-123&target=" + userId);

    const result = await completeShortCode(
      "password-reset",
      url,
      passwordForm(),
      t,
      t("authFlow.feedback.serviceUnavailable"),
      t("authFlow.feedback.passwordReset"),
      setup.context
    );

    expect(result.outcome).toBe("success");
    expect(setup.mocks.resetPassword).toHaveBeenCalledWith("anonymous-access", {
      password: "replacement-password",
      shortCode: "code-123",
      userID: userId,
    });
  });

  it.each([403, 404, 409])("collapses rejected link status %s to one invalid state", async (status) => {
    setup.mocks.register.mockRejectedValue(new HttpError(status, "rejected"));

    const result = await completeShortCode(
      "register",
      registrationUrl(),
      passwordForm(),
      t,
      t("authFlow.feedback.serviceUnavailable"),
      t("authFlow.feedback.registrationCompleted"),
      setup.context
    );

    expect(result).toMatchObject({
      outcome: "invalid",
      model: { journey: "register", state: { status: "invalid" } },
    });
  });

  it("keeps service failures retryable without exposing the link", async () => {
    setup.mocks.register.mockRejectedValue(new Error("network unavailable"));

    const result = await completeShortCode(
      "register",
      registrationUrl(),
      passwordForm(),
      t,
      t("authFlow.feedback.serviceUnavailable"),
      t("authFlow.feedback.registrationCompleted"),
      setup.context
    );

    expect(result).toMatchObject({
      outcome: "service-error",
      model: {
        journey: "register",
        state: { status: "service-error", message: t("authFlow.feedback.serviceUnavailable") },
      },
    });
    expect(JSON.stringify(result.model)).not.toContain("code-123");
  });
});
