import { parseShortCodeLink, safeReturnTo, validateLogin, validateNewPassword, validatePasswordChange } from "./forms";

import { describe, expect, it } from "vitest";

function encoded(value: string): string {
  return Buffer.from(value).toString("base64url");
}

describe("auth form validation", () => {
  it("normalizes a valid login without returning secrets in issues", () => {
    const form = new FormData();
    form.set("email", "  Creator@Example.com ");
    form.set("password", "a-secure-password");

    expect(validateLogin(form)).toEqual({
      success: true,
      value: {
        email: "creator@example.com",
        password: "a-secure-password",
      },
    });
  });

  it("maps invalid login values to stable field-safe feedback codes", () => {
    const form = new FormData();
    form.set("email", "not an email");
    form.set("password", "");

    expect(validateLogin(form)).toEqual({
      success: false,
      issues: [
        { field: "email", feedback: "email" },
        { field: "password", feedback: "password" },
      ],
    });
  });

  it("requires every password-change field and matching replacements", () => {
    const form = new FormData();
    form.set("currentPassword", "current-password");
    form.set("password", "replacement-password");
    form.set("confirmPassword", "different-password");

    expect(validatePasswordChange(form)).toEqual({
      success: false,
      issues: [{ field: "confirmPassword", feedback: "passwordMismatch" }],
    });
  });

  it("validates a matching new password for secure-link flows", () => {
    const form = new FormData();
    form.set("password", "replacement-password");
    form.set("confirmPassword", "replacement-password");

    expect(validateNewPassword(form)).toEqual({
      success: true,
      value: { password: "replacement-password" },
    });
  });
});

describe("safe URL helpers", () => {
  it.each([
    ["/account?panel=password#change", "/account?panel=password#change"],
    ["https://attacker.invalid/account", "/"],
    ["//attacker.invalid/account", "/"],
    ["javascript:alert(1)", "/"],
  ])("normalizes return target %s", (value, expected) => {
    expect(safeReturnTo(value)).toBe(expected);
  });
});

describe("parseShortCodeLink", () => {
  it("parses a registration link and keeps the raw values server-side", () => {
    const url = new URL(
      `https://studio.test/ext/account/create?shortCode=code-123&target=${encoded("Creator@Example.com")}`
    );

    expect(parseShortCodeLink("register", url)).toEqual({
      status: "ready",
      journey: "register",
      email: "creator@example.com",
      shortCode: "code-123",
    });
  });

  it("parses an email-update link with its display-only source", () => {
    const userId = "140f24ee-1531-4a9d-ace8-20b38e1b21bc";
    const url = new URL(
      `https://studio.test/ext/email/validate?shortCode=code-123&target=${userId}&source=${encoded("new@example.com")}`
    );

    expect(parseShortCodeLink("email-update", url)).toEqual({
      status: "ready",
      journey: "email-update",
      email: "new@example.com",
      shortCode: "code-123",
      userId,
    });
  });

  it("parses a password-reset link without exposing its user ID as a hint", () => {
    const userId = "140f24ee-1531-4a9d-ace8-20b38e1b21bc";
    const url = new URL(`https://studio.test/ext/password/reset?shortCode=code-123&target=${userId}`);

    expect(parseShortCodeLink("password-reset", url)).toEqual({
      status: "ready",
      journey: "password-reset",
      shortCode: "code-123",
      userId,
    });
  });

  it("treats absent parameters as missing and duplicates as invalid", () => {
    expect(parseShortCodeLink("register", new URL("https://studio.test/ext/account/create"))).toEqual({
      status: "missing",
    });

    const duplicate = new URL(
      `https://studio.test/ext/account/create?shortCode=one&shortCode=two&target=${encoded("a@example.com")}`
    );
    expect(parseShortCodeLink("register", duplicate)).toEqual({ status: "invalid" });
  });

  it("rejects malformed targets before any service operation", () => {
    const url = new URL("https://studio.test/ext/password/reset?shortCode=code-123&target=not-a-user-id");
    expect(parseShortCodeLink("password-reset", url)).toEqual({ status: "invalid" });
  });
});
