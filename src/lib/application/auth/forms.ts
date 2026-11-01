import type { AuthenticationValidation, FormIssue } from "./types";

import {
  EmailSchema,
  ShortCodeCreateRegisterRequestSchema,
  TokenCreateRequestSchema,
  WaitlistJoinRequestSchema,
} from "@a-novel/service-authentication-rest";

import { z } from "zod";

/** Validated service input or serializable field errors without submitted values. */
export type ValidationResult<Value, Field extends string> =
  { success: true; value: Value } | { success: false; issues: readonly FormIssue<Field>[] };

const emailSchema = z.string().trim().toLowerCase().pipe(EmailSchema);
const loginSchema = TokenCreateRequestSchema.extend({ email: emailSchema });
const emailRequestSchema = ShortCodeCreateRegisterRequestSchema.pick({ email: true }).extend({ email: emailSchema });
const invitationRequestSchema = WaitlistJoinRequestSchema.pick({ email: true }).extend({
  email: z.string().trim().pipe(WaitlistJoinRequestSchema.shape.email),
});

function validationMessage(issue: z.core.$ZodIssue, empty: boolean): AuthenticationValidation {
  if (issue.code === "too_big") return { feedback: "maxLength", limit: Number(issue.maximum) };
  if (issue.code === "too_small" && !empty) return { feedback: "minLength", limit: Number(issue.minimum) };
  return { feedback: issue.path[0] === "email" ? "email" : "password" };
}

function textValue(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}

function formValidator<Value, Field extends string>(schema: z.ZodType<Value>, fields: Record<string, Field>) {
  return (form: FormData): ValidationResult<Value, Field> => {
    const values = Object.fromEntries(Object.keys(fields).map((name) => [name, textValue(form, name)]));
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

/** Checks the email used by password-recovery requests. */
export const validateEmailRequest = formValidator(emailRequestSchema, { email: "email" } as const);

/** Preserves email casing for the service's case-sensitive membership checks. */
export const validateInvitationRequest = formValidator(invitationRequestSchema, { email: "email" } as const);
