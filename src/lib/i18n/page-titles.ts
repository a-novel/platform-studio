import type { AuthenticationPanelModel, ShortCodeJourney, ShortCodeScreenModel } from "$lib/application/auth/types";

import type { TFunction } from "i18next";

function journeyTitle(t: TFunction<"common">, journey: AuthenticationPanelModel["journey"] | ShortCodeJourney) {
  switch (journey) {
    case "login":
      return t("shell.auth.login.title");
    case "register":
      return t("pageTitles.createAccount");
    case "reset":
    case "password-reset":
      return t("pageTitles.resetPassword");
    case "email-update":
      return t("pageTitles.confirmEmail");
  }
}

/** Labels the active authentication task without exposing the submitted email address. */
export function authenticationPageTitle(t: TFunction<"common">, { journey, state }: AuthenticationPanelModel) {
  const title = journeyTitle(t, journey);
  if (state.status === "pending-email")
    return t("pageTitles.withState", { title, status: t("authUi.authentication.pendingTitle") });
  if (state.status === "service-error")
    return t("pageTitles.withState", { title, status: t("authUi.serviceUnavailable") });
  return title;
}

/** Keeps the secure-link task identifiable after completion or a rejected link. */
export function shortCodePageTitle(t: TFunction<"common">, { journey, state }: ShortCodeScreenModel) {
  const title = journeyTitle(t, journey);
  switch (state.status) {
    case "success":
      if (journey === "register") return t("pageTitles.accountCreated");
      return journey === "password-reset" ? t("pageTitles.passwordReset") : t("pageTitles.emailUpdated");
    case "missing":
      return t("pageTitles.withState", { title, status: t("pageTitles.incompleteLink") });
    case "invalid":
      return t("pageTitles.withState", { title, status: t("pageTitles.invalidLink") });
    case "service-error":
      return t("pageTitles.withState", { title, status: t("authUi.serviceUnavailable") });
    default:
      return title;
  }
}

/** Uses a readable error description instead of a bare HTTP status in the tab. */
export function errorPageTitle(t: TFunction<"common">, status: number) {
  switch (status) {
    case 404:
      return t("pageTitles.notFound");
    case 403:
      return t("access.forbidden.title");
    case 503:
      return t("access.unavailable.title");
    default:
      return t("access.error.title");
  }
}
