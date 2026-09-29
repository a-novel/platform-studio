import type { AuthenticationValidation, FormIssue } from "./types";

import {
  CredentialsCreateRequestSchema,
  CredentialsUpdatePasswordRequestSchema,
  EmailSchema,
  PasswordSchema,
  ShortCodeCreateRegisterRequestSchema,
  TokenCreateRequestSchema,
} from "@a-novel/service-authentication-rest";

import { z } from "zod";

/** Validated service input or serializable field errors without submitted values. */
export type ValidationResult<Value, Field extends string> =
  { success: true; value: Value } | { success: false; issues: readonly FormIssue<Field>[] };

const emailSchema = z.string().trim().toLowerCase().pipe(EmailSchema);
const loginSchema = TokenCreateRequestSchema.extend({ email: emailSchema });
const emailRequestSchema = ShortCodeCreateRegisterRequestSchema.pick({ email: true }).extend({ email: emailSchema });
const passwordSchema = CredentialsCreateRequestSchema.pick({ password: true }).extend({
  confirmPassword: PasswordSchema,
});
const matchingPasswords = ({ password, confirmPassword }: z.infer<typeof passwordSchema>) =>
  password === confirmPassword;
const confirmationError = { path: ["confirmPassword"], error: "passwordMismatch" };
const newPasswordSchema = passwordSchema
  .refine(matchingPasswords, confirmationError)
  .transform(({ password }) => ({ password }));
const passwordChangeSchema = CredentialsUpdatePasswordRequestSchema.extend({ confirmPassword: PasswordSchema })
  .refine(matchingPasswords, confirmationError)
  .transform(({ currentPassword, password }) => ({ currentPassword, password }));

function validationMessage(issue: z.core.$ZodIssue, empty: boolean): AuthenticationValidation {
  if (issue.code === "too_big") return { feedback: "maxLength", limit: Number(issue.maximum) };
  if (issue.code === "too_small" && !empty) return { feedback: "minLength", limit: Number(issue.minimum) };
  if (issue.code === "custom") return { feedback: "passwordMismatch" };
  switch (issue.path[0]) {
    case "email":
      return { feedback: "email" };
    case "currentPassword":
      return { feedback: "currentPassword" };
    case "confirmPassword":
      return { feedback: "confirmPassword" };
    default:
      return { feedback: "password" };
  }
}

function formValidator<Value, Field extends string>(schema: z.ZodType<Value>, fields: Record<string, Field>) {
  return (form: FormData): ValidationResult<Value, Field> => {
    const values = Object.fromEntries(
      Object.keys(fields).map((name) => {
        const value = form.get(name);
        return [name, typeof value === "string" ? value : ""];
      })
    );
    const parsed = schema.safeParse(values);
    if (parsed.success) return { success: true, value: parsed.data };

    const issues: FormIssue<Field>[] = [];
    for (const issue of parsed.error.issues) {
      const name = String(issue.path[0]);
      const field = fields[name];
      if (!field) throw new Error("Unmapped authentication form field");
      if (!issues.some((existing) => existing.field === field)) {
        issues.push({ field, ...validationMessage(issue, values[name] === "") });
      }
    }
    return { success: false, issues };
  };
}

/** Checks login fields against the service contract and normalizes the email. */
export const validateLogin = formValidator(loginSchema, { email: "email", password: "password" } as const);

/** Checks the email used by registration and password-recovery requests. */
export const validateEmailRequest = formValidator(emailRequestSchema, { email: "email" } as const);

/** Returns email-update errors under the account screen's field name. */
export const validateEmailUpdate = formValidator(emailRequestSchema, { email: "newEmail" } as const);

/** Extends the service password-change request with confirmation, stripped from successful output. */
export const validatePasswordChange = formValidator(passwordChangeSchema, {
  currentPassword: "currentPassword",
  password: "newPassword",
  confirmPassword: "confirmPassword",
} as const);

/** Checks registration/reset passwords and strips the UI-only confirmation. */
export const validateNewPassword = formValidator(newPasswordSchema, {
  password: "newPassword",
  confirmPassword: "confirmPassword",
} as const);
