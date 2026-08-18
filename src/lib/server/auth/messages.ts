import type { AuthValidationMessages } from "./forms";

import type { TFunction } from "i18next";

export interface AuthFlowCopy {
  accountName(userId: string): string;
  expiryUnavailable: string;
  feedback: {
    emailUpdated: string;
    invalidCredentials: string;
    invalidCurrentPassword: string;
    passwordChanged: string;
    passwordReset: string;
    registrationCompleted: string;
    serviceUnavailable: string;
    sessionUnavailable: string;
  };
  validation: AuthValidationMessages;
}

export function getAuthFlowCopy(t: TFunction<"common">): AuthFlowCopy {
  return {
    accountName: (userId) => t("authFlow.accountName", { id: userId.slice(0, 8) }),
    expiryUnavailable: t("authFlow.expiryUnavailable"),
    feedback: {
      emailUpdated: t("authFlow.feedback.emailUpdated"),
      invalidCredentials: t("authFlow.feedback.invalidCredentials"),
      invalidCurrentPassword: t("authFlow.feedback.invalidCurrentPassword"),
      passwordChanged: t("authFlow.feedback.passwordChanged"),
      passwordReset: t("authFlow.feedback.passwordReset"),
      registrationCompleted: t("authFlow.feedback.registrationCompleted"),
      serviceUnavailable: t("authFlow.feedback.serviceUnavailable"),
      sessionUnavailable: t("authFlow.feedback.sessionUnavailable"),
    },
    validation: {
      confirmPassword: t("authFlow.validation.confirmPassword"),
      currentPassword: t("authFlow.validation.currentPassword"),
      email: t("authFlow.validation.email"),
      newPassword: t("authFlow.validation.newPassword"),
      password: t("authFlow.validation.password"),
      passwordMismatch: t("authFlow.validation.passwordMismatch"),
    },
  };
}
