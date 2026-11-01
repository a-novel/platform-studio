import type { AuthenticationJourney, AuthenticationPanelModel } from "#lib/application/auth/types.js";

import type { TFunction } from "i18next";

function journeyTitle(t: TFunction<"common">, journey: AuthenticationJourney) {
  switch (journey) {
    case "login":
      return t("shell.auth.login.title");
    case "register":
      return t("shell.auth.register.title");
    case "reset":
      return t("pageTitles.resetPassword");
  }
}

/** Labels the active authentication task without exposing the submitted email address. */
export function authenticationPageTitle(t: TFunction<"common">, { journey, state }: AuthenticationPanelModel) {
  const title = journeyTitle(t, journey);
  if (state.status === "recorded") return t("authUi.authentication.journeys.register.recordedTitle");
  if (state.status === "pending-email")
    return t("pageTitles.withState", { title, status: t("authUi.authentication.pendingTitle") });
  if (state.status === "service-error")
    return t("pageTitles.withState", { title, status: t("authUi.serviceUnavailable") });
  return title;
}

/** Uses a readable error description instead of a bare HTTP status in the tab. */
export function errorPageTitle(t: TFunction<"common">, status: number, downtime = false) {
  if (downtime) return t("access.downtime.title");

  switch (status) {
    case 404:
      return t("access.notFound.title");
    case 403:
      return t("access.forbidden.title");
    case 503:
      return t("access.unavailable.title");
    default:
      return t("access.error.title");
  }
}
