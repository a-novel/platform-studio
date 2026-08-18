import type { AuthUiCopy } from "./copy";

import type { TFunction } from "i18next";

/** Builds serializable auth UI copy from a request-scoped translator. */
export function getAuthUiCopy(t: TFunction<"common">): AuthUiCopy {
  return {
    authentication: {
      emailLabel: t("authUi.authentication.emailLabel"),
      emailHint: t("authUi.authentication.emailHint"),
      passwordLabel: t("authUi.authentication.passwordLabel"),
      validationTitle: t("authUi.authentication.validationTitle"),
      validationDescription: t("authUi.authentication.validationDescription"),
      serviceErrorTitle: t("authUi.authentication.serviceErrorTitle"),
      successTitle: t("authUi.authentication.successTitle"),
      pendingTitle: t("authUi.authentication.pendingTitle"),
      pendingTargetLabel: t("authUi.authentication.pendingTargetLabel"),
      pendingPrivacy: t("authUi.authentication.pendingPrivacy"),
      submitting: t("authUi.authentication.submitting"),
      journeys: {
        login: {
          submit: t("authUi.authentication.journeys.login.submit"),
        },
        register: {
          submit: t("authUi.authentication.journeys.register.submit"),
          pendingDescription: t("authUi.authentication.journeys.register.pendingDescription"),
        },
        reset: {
          submit: t("authUi.authentication.journeys.reset.submit"),
          pendingDescription: t("authUi.authentication.journeys.reset.pendingDescription"),
        },
      },
    },
    account: {
      eyebrow: t("authUi.account.eyebrow"),
      title: t("authUi.account.title"),
      description: t("authUi.account.description"),
      loadingTitle: t("authUi.account.loadingTitle"),
      loadingDescription: t("authUi.account.loadingDescription"),
      loadErrorTitle: t("authUi.account.loadErrorTitle"),
      retry: t("authUi.account.retry"),
      claims: {
        title: t("authUi.account.claims.title"),
        description: t("authUi.account.claims.description"),
        userId: t("authUi.account.claims.userId"),
        roles: t("authUi.account.claims.roles"),
        accessExpiresAt: t("authUi.account.claims.accessExpiresAt"),
        refreshExpiresAt: t("authUi.account.claims.refreshExpiresAt"),
        noRoles: t("authUi.account.claims.noRoles"),
        privacyTitle: t("authUi.account.claims.privacyTitle"),
        privacyDescription: t("authUi.account.claims.privacyDescription"),
      },
      password: {
        title: t("authUi.account.password.title"),
        description: t("authUi.account.password.description"),
        currentLabel: t("authUi.account.password.currentLabel"),
        newLabel: t("authUi.account.password.newLabel"),
        confirmLabel: t("authUi.account.password.confirmLabel"),
        hint: t("authUi.account.password.hint"),
        submit: t("authUi.account.password.submit"),
        submitting: t("authUi.account.password.submitting"),
        validationTitle: t("authUi.account.password.validationTitle"),
        serviceErrorTitle: t("authUi.account.password.serviceErrorTitle"),
        successTitle: t("authUi.account.password.successTitle"),
      },
      email: {
        title: t("authUi.account.email.title"),
        description: t("authUi.account.email.description"),
        label: t("authUi.account.email.label"),
        hint: t("authUi.account.email.hint"),
        submit: t("authUi.account.email.submit"),
        resend: t("authUi.account.email.resend"),
        submitting: t("authUi.account.email.submitting"),
        validationTitle: t("authUi.account.email.validationTitle"),
        serviceErrorTitle: t("authUi.account.email.serviceErrorTitle"),
        pendingTitle: t("authUi.account.email.pendingTitle"),
        pendingDescription: t("authUi.account.email.pendingDescription"),
        pendingTargetLabel: t("authUi.account.email.pendingTargetLabel"),
        pendingPrivacy: t("authUi.account.email.pendingPrivacy"),
        successTitle: t("authUi.account.email.successTitle"),
      },
      logout: {
        title: t("authUi.account.logout.title"),
        description: t("authUi.account.logout.description"),
        submit: t("authUi.account.logout.submit"),
        submitting: t("authUi.account.logout.submitting"),
        serviceErrorTitle: t("authUi.account.logout.serviceErrorTitle"),
      },
    },
    shortCode: {
      brand: t("authUi.shortCode.brand"),
      home: t("authUi.shortCode.home"),
      eyebrow: t("authUi.shortCode.eyebrow"),
      targetLabel: t("authUi.shortCode.targetLabel"),
      newPasswordLabel: t("authUi.shortCode.newPasswordLabel"),
      confirmPasswordLabel: t("authUi.shortCode.confirmPasswordLabel"),
      passwordHint: t("authUi.shortCode.passwordHint"),
      submitting: t("authUi.shortCode.submitting"),
      validationTitle: t("authUi.shortCode.validationTitle"),
      validationDescription: t("authUi.shortCode.validationDescription"),
      serviceErrorTitle: t("authUi.shortCode.serviceErrorTitle"),
      successTitle: t("authUi.shortCode.successTitle"),
      continue: t("authUi.shortCode.continue"),
      restart: t("authUi.shortCode.restart"),
      states: {
        missing: {
          title: t("authUi.shortCode.states.missing.title"),
          description: t("authUi.shortCode.states.missing.description"),
        },
        invalid: {
          title: t("authUi.shortCode.states.invalid.title"),
          description: t("authUi.shortCode.states.invalid.description"),
        },
        expired: {
          title: t("authUi.shortCode.states.expired.title"),
          description: t("authUi.shortCode.states.expired.description"),
        },
      },
      journeys: {
        register: {
          title: t("authUi.shortCode.journeys.register.title"),
          description: t("authUi.shortCode.journeys.register.description"),
          submit: t("authUi.shortCode.journeys.register.submit"),
        },
        emailUpdate: {
          title: t("authUi.shortCode.journeys.emailUpdate.title"),
          description: t("authUi.shortCode.journeys.emailUpdate.description"),
          submit: t("authUi.shortCode.journeys.emailUpdate.submit"),
        },
        passwordReset: {
          title: t("authUi.shortCode.journeys.passwordReset.title"),
          description: t("authUi.shortCode.journeys.passwordReset.description"),
          submit: t("authUi.shortCode.journeys.passwordReset.submit"),
        },
      },
    },
  };
}
