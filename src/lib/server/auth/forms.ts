import type {
  AccountPasswordField,
  AuthenticationField,
  FormIssue,
  ShortCodeJourney,
  ShortCodePasswordField,
} from "$lib/application/auth/types";

import { EmailSchema, PasswordSchema, ShortCodeSchema } from "@a-novel/service-authentication-rest";

import type { TFunction } from "i18next";
import { z } from "zod";

export type ValidationResult<Value, Field extends string> =
  { success: true; value: Value } | { success: false; issues: readonly FormIssue<Field>[] };

export type ParsedShortCodeLink =
  | { status: "missing" }
  | { status: "invalid" }
  | {
      status: "ready";
      journey: "register";
      email: string;
      shortCode: string;
    }
  | {
      status: "ready";
      journey: "email-update";
      email: string;
      shortCode: string;
      userId: string;
    }
  | {
      status: "ready";
      journey: "password-reset";
      shortCode: string;
      userId: string;
    };

const userIdSchema = z.uuid();

function readText(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function issue<Field extends string>(field: Field, message: string): FormIssue<Field> {
  return { field, message };
}

export function validateLogin(
  form: FormData,
  t: TFunction<"common">
): ValidationResult<{ email: string; password: string }, AuthenticationField> {
  const email = normalizeEmail(readText(form, "email"));
  const password = readText(form, "password");
  const issues: FormIssue<AuthenticationField>[] = [];

  if (!EmailSchema.safeParse(email).success) issues.push(issue("email", t("authFlow.validation.email")));
  if (!PasswordSchema.safeParse(password).success) issues.push(issue("password", t("authFlow.validation.password")));

  return issues.length > 0 ? { success: false, issues } : { success: true, value: { email, password } };
}

export function validateEmailRequest(
  form: FormData,
  t: TFunction<"common">
): ValidationResult<{ email: string }, "email"> {
  const email = normalizeEmail(readText(form, "email"));

  return EmailSchema.safeParse(email).success
    ? { success: true, value: { email } }
    : { success: false, issues: [issue("email", t("authFlow.validation.email"))] };
}

export function validatePasswordChange(
  form: FormData,
  t: TFunction<"common">
): ValidationResult<{ currentPassword: string; password: string }, AccountPasswordField> {
  const currentPassword = readText(form, "currentPassword");
  const password = readText(form, "password");
  const confirmPassword = readText(form, "confirmPassword");
  const issues: FormIssue<AccountPasswordField>[] = [];

  if (!PasswordSchema.safeParse(currentPassword).success) {
    issues.push(issue("currentPassword", t("authFlow.validation.currentPassword")));
  }
  if (!PasswordSchema.safeParse(password).success) {
    issues.push(issue("newPassword", t("authFlow.validation.newPassword")));
  }
  if (!PasswordSchema.safeParse(confirmPassword).success) {
    issues.push(issue("confirmPassword", t("authFlow.validation.confirmPassword")));
  } else if (password !== confirmPassword) {
    issues.push(issue("confirmPassword", t("authFlow.validation.passwordMismatch")));
  }

  return issues.length > 0 ? { success: false, issues } : { success: true, value: { currentPassword, password } };
}

export function validateNewPassword(
  form: FormData,
  t: TFunction<"common">
): ValidationResult<{ password: string }, ShortCodePasswordField> {
  const password = readText(form, "password");
  const confirmPassword = readText(form, "confirmPassword");
  const issues: FormIssue<ShortCodePasswordField>[] = [];

  if (!PasswordSchema.safeParse(password).success) {
    issues.push(issue("newPassword", t("authFlow.validation.newPassword")));
  }
  if (!PasswordSchema.safeParse(confirmPassword).success) {
    issues.push(issue("confirmPassword", t("authFlow.validation.confirmPassword")));
  } else if (password !== confirmPassword) {
    issues.push(issue("confirmPassword", t("authFlow.validation.passwordMismatch")));
  }

  return issues.length > 0 ? { success: false, issues } : { success: true, value: { password } };
}

export function safeReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";

  try {
    const target = new URL(value, "https://studio.invalid");
    if (target.origin !== "https://studio.invalid") return "/";
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return "/";
  }
}

export function parseShortCodeLink(journey: ShortCodeJourney, url: URL): ParsedShortCodeLink {
  const code = readParameter(url.searchParams, "shortCode");
  const target = readParameter(url.searchParams, "target");

  if (code.status === "missing" || target.status === "missing") return { status: "missing" };
  if (code.status === "invalid" || target.status === "invalid") return { status: "invalid" };
  if (!ShortCodeSchema.safeParse(code.value).success || code.value.length === 0) return { status: "invalid" };

  if (journey === "register") {
    const email = decodeEmail(target.value);
    return email
      ? {
          status: "ready",
          journey,
          email,
          shortCode: code.value,
        }
      : { status: "invalid" };
  }

  if (!userIdSchema.safeParse(target.value).success) return { status: "invalid" };

  if (journey === "password-reset") {
    return {
      status: "ready",
      journey,
      shortCode: code.value,
      userId: target.value,
    };
  }

  const source = readParameter(url.searchParams, "source");
  if (source.status === "missing") return { status: "missing" };
  if (source.status === "invalid") return { status: "invalid" };

  const email = decodeEmail(source.value);
  return email
    ? {
        status: "ready",
        journey,
        email,
        shortCode: code.value,
        userId: target.value,
      }
    : { status: "invalid" };
}

function readParameter(
  parameters: URLSearchParams,
  name: string
): { status: "missing" } | { status: "invalid" } | { status: "ready"; value: string } {
  const values = parameters.getAll(name);
  if (values.length === 0 || values[0] === "") return { status: "missing" };
  if (values.length !== 1 || !values[0]) return { status: "invalid" };
  return { status: "ready", value: values[0] };
}

function decodeEmail(value: string): string | null {
  if (value.length > 2048 || !/^[A-Za-z0-9+/_-]+={0,2}$/.test(value)) return null;

  try {
    const email = Buffer.from(value, "base64url").toString("utf8");
    return EmailSchema.safeParse(email).success ? normalizeEmail(email) : null;
  } catch {
    return null;
  }
}
