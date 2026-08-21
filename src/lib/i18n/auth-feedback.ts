import type { AuthenticationFeedback, AuthenticationValidation } from "$lib/application/auth/types";

import type { TFunction } from "i18next";

/** Resolves a stable authentication feedback category through the active locale. */
export function translateAuthenticationFeedback(t: TFunction<"common">, feedback: AuthenticationFeedback): string {
  switch (feedback) {
    case "emailUpdated":
      return t("authFlow.feedback.emailUpdated");
    case "invalidCredentials":
      return t("authFlow.feedback.invalidCredentials");
    case "invalidCurrentPassword":
      return t("authFlow.feedback.invalidCurrentPassword");
    case "passwordChanged":
      return t("authFlow.feedback.passwordChanged");
    case "passwordReset":
      return t("authFlow.feedback.passwordReset");
    case "registrationCompleted":
      return t("authFlow.feedback.registrationCompleted");
    case "serviceUnavailable":
      return t("authFlow.feedback.serviceUnavailable");
    case "sessionUnavailable":
      return t("authFlow.feedback.sessionUnavailable");
  }
}

/** Resolves a stable form-validation category through the active locale. */
export function translateAuthenticationValidation(t: TFunction<"common">, feedback: AuthenticationValidation): string {
  switch (feedback) {
    case "confirmPassword":
      return t("authFlow.validation.confirmPassword");
    case "currentPassword":
      return t("authFlow.validation.currentPassword");
    case "email":
      return t("authFlow.validation.email");
    case "newPassword":
      return t("authFlow.validation.newPassword");
    case "password":
      return t("authFlow.validation.password");
    case "passwordMismatch":
      return t("authFlow.validation.passwordMismatch");
  }
}
