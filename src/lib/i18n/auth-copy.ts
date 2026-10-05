import type { AuthenticationJourney, ShortCodeJourney, ShortCodeScreenModel } from "#lib/application/auth/types.js";

import { translateAuthenticationFeedback } from "./auth-feedback";

import type { TFunction } from "i18next";

const authenticationJourneyKeys = {
  login: {
    submit: (t: TFunction<"common">) => t("authUi.authentication.journeys.login.submit"),
    submitting: (t: TFunction<"common">) => t("authUi.authentication.journeys.login.submitting"),
  },
  register: {
    submit: (t: TFunction<"common">) => t("authUi.authentication.journeys.register.submit"),
    submitting: (t: TFunction<"common">) => t("authUi.authentication.journeys.register.submitting"),
  },
  reset: {
    submit: (t: TFunction<"common">) => t("authUi.authentication.journeys.reset.submit"),
    submitting: (t: TFunction<"common">) => t("authUi.authentication.journeys.reset.submitting"),
  },
} as const;

const shortCodeJourneyKeys = {
  "password-reset": {
    description: (t: TFunction<"common">) => t("authUi.shortCode.journeys.passwordReset.description"),
    submit: (t: TFunction<"common">) => t("authUi.shortCode.journeys.passwordReset.submit"),
    submitting: (t: TFunction<"common">) => t("authUi.shortCode.journeys.passwordReset.submitting"),
    title: (t: TFunction<"common">) => t("authUi.shortCode.journeys.passwordReset.title"),
  },
  register: {
    description: (t: TFunction<"common">) => t("authUi.shortCode.journeys.register.description"),
    submit: (t: TFunction<"common">) => t("authUi.shortCode.journeys.register.submit"),
    submitting: (t: TFunction<"common">) => t("authUi.shortCode.journeys.register.submitting"),
    title: (t: TFunction<"common">) => t("authUi.shortCode.journeys.register.title"),
  },
} as const;

const shortCodeStatusKeys = {
  invalid: {
    description: (t: TFunction<"common">) => t("authUi.shortCode.states.invalid.description"),
    title: (t: TFunction<"common">) => t("authUi.shortCode.states.invalid.title"),
  },
  missing: {
    description: (t: TFunction<"common">) => t("authUi.shortCode.states.missing.description"),
    title: (t: TFunction<"common">) => t("authUi.shortCode.states.missing.title"),
  },
} as const;

type AuthenticationJourneyMessage = keyof (typeof authenticationJourneyKeys)["login"];
type ShortCodeJourneyMessage = keyof (typeof shortCodeJourneyKeys)["register"];
type ShortCodeStatus = keyof typeof shortCodeStatusKeys;
type ShortCodeStatusMessage = keyof (typeof shortCodeStatusKeys)["missing"];

export function translateAuthenticationJourney(
  t: TFunction<"common">,
  journey: AuthenticationJourney,
  message: AuthenticationJourneyMessage
): string {
  return authenticationJourneyKeys[journey][message](t);
}

export function translateShortCodeJourney(
  t: TFunction<"common">,
  journey: Exclude<ShortCodeJourney, "email-update">,
  message: ShortCodeJourneyMessage
): string {
  return shortCodeJourneyKeys[journey][message](t);
}

export function translateShortCodeStatus(
  t: TFunction<"common">,
  status: ShortCodeStatus,
  message: ShortCodeStatusMessage
): string {
  return shortCodeStatusKeys[status][message](t);
}

/** Names the current secure-link step in the page heading. */
export function translateShortCodeTitle(t: TFunction<"common">, { journey, state }: ShortCodeScreenModel): string {
  switch (state.status) {
    case "missing":
    case "invalid":
      return translateShortCodeStatus(t, state.status, "title");
    case "success":
      return translateAuthenticationFeedback(t, state.feedback);
    default:
      return journey === "email-update"
        ? state.status === "service-error"
          ? t("authUi.shortCode.journeys.emailUpdate.unavailableTitle")
          : t("authUi.shortCode.journeys.emailUpdate.submitting")
        : translateShortCodeJourney(t, journey, "title");
  }
}
