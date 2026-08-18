import type { StudioShellCopy } from "./types";

import type { TFunction } from "i18next";

/** Builds serializable shell copy from a request-scoped translator. */
export function getStudioShellCopy(t: TFunction<"common">): StudioShellCopy {
  return {
    accountMenu: t("shell.accountMenu"),
    auth: {
      login: {
        title: t("shell.auth.login.title"),
        description: t("shell.auth.login.description"),
      },
      register: {
        title: t("shell.auth.register.title"),
        description: t("shell.auth.register.description"),
      },
      reset: {
        title: t("shell.auth.reset.title"),
        description: t("shell.auth.reset.description"),
      },
    },
    backToSignIn: t("shell.auth.backToSignIn"),
    brand: t("shell.brand"),
    closeAuthentication: t("shell.closeAuthentication"),
    closeNavigation: t("shell.closeNavigation"),
    collapseNavigation: t("shell.collapseNavigation"),
    createAccount: t("shell.auth.createAccount"),
    expandNavigation: t("shell.expandNavigation"),
    forgotPassword: t("shell.auth.forgotPassword"),
    formPlaceholder: t("shell.auth.formPlaceholder"),
    home: t("shell.home"),
    homeTitle: t("shell.homeTitle"),
    logout: t("shell.logout"),
    manageAccount: t("shell.manageAccount"),
    navigation: t("shell.navigation"),
    openNavigation: t("shell.openNavigation"),
    retrySession: t("shell.retrySession"),
    sessionLoading: t("shell.sessionLoading"),
    signIn: t("shell.signIn"),
    signInInstead: t("shell.auth.signInInstead"),
    skipToContent: t("shell.skipToContent"),
  };
}
