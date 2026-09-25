import type { AuthenticationJourney, ShortCodeJourney } from "$lib/application/auth/types";

import type { TFunction } from "i18next";

const authenticationJourneyKeys = {
  login: {
    pendingDescription: (t: TFunction<"common">) => t("authUi.authentication.journeys.reset.pendingDescription"),
    submit: (t: TFunction<"common">) => t("authUi.authentication.journeys.login.submit"),
    submitting: (t: TFunction<"common">) => t("authUi.authentication.journeys.login.submitting"),
  },
  register: {
    pendingDescription: (t: TFunction<"common">) => t("authUi.authentication.journeys.register.pendingDescription"),
    submit: (t: TFunction<"common">) => t("authUi.authentication.journeys.register.submit"),
    submitting: (t: TFunction<"common">) => t("authUi.authentication.journeys.register.submitting"),
  },
  reset: {
    pendingDescription: (t: TFunction<"common">) => t("authUi.authentication.journeys.reset.pendingDescription"),
    submit: (t: TFunction<"common">) => t("authUi.authentication.journeys.reset.submit"),
    submitting: (t: TFunction<"common">) => t("authUi.authentication.journeys.reset.submitting"),
  },
} as const;

const shortCodeJourneyKeys = {
  "email-update": {
    description: (t: TFunction<"common">) => t("authUi.shortCode.journeys.emailUpdate.description"),
    submit: (t: TFunction<"common">) => t("authUi.shortCode.journeys.emailUpdate.submit"),
    submitting: (t: TFunction<"common">) => t("authUi.shortCode.journeys.emailUpdate.submitting"),
    title: (t: TFunction<"common">) => t("authUi.shortCode.journeys.emailUpdate.title"),
  },
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
  expired: {
    description: (t: TFunction<"common">) => t("authUi.shortCode.states.expired.description"),
    title: (t: TFunction<"common">) => t("authUi.shortCode.states.expired.title"),
  },
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
  journey: ShortCodeJourney,
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
