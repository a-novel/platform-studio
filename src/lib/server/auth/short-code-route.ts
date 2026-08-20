import type { ShortCodePageData } from "$lib/application/auth/short-code-route";
import type { ShortCodeJourney } from "$lib/application/auth/types";

import { createAuthenticationContext } from "./context";
import { completeShortCode, createShortCodeClient, readShortCodeModel } from "./short-code";

import type { RequestEvent } from "@sveltejs/kit";
import { fail, redirect } from "@sveltejs/kit";
import type { TFunction } from "i18next";

interface RouteDetails {
  continueHref: string;
  restartHref: string;
}

const routeDetails: Record<ShortCodeJourney, RouteDetails> = {
  register: {
    continueHref: "/",
    restartHref: "/?auth=register",
  },
  "email-update": {
    continueHref: "/account",
    restartHref: "/account",
  },
  "password-reset": {
    continueHref: "/?auth=login",
    restartHref: "/?auth=reset",
  },
};

export function loadShortCodeRoute(
  journey: ShortCodeJourney,
  event: Pick<RequestEvent, "locals" | "url">
): ShortCodePageData {
  const t = event.locals.i18n.getFixedT(event.locals.locale, "common");

  return {
    links: {
      continueHref: routeDetails[journey].continueHref,
      homeHref: "/",
      restartHref: routeDetails[journey].restartHref,
    },
    model: readShortCodeModel(journey, event.url, successMessage(journey, t)),
  };
}

export async function submitShortCodeRoute(journey: ShortCodeJourney, event: RequestEvent) {
  const t = event.locals.i18n.getFixedT(event.locals.locale, "common");
  const authentication = createAuthenticationContext(event.cookies, event.url);
  const result = await completeShortCode(
    journey,
    event.url,
    await event.request.formData(),
    t,
    t("authFlow.feedback.serviceUnavailable"),
    successMessage(journey, t),
    {
      accept: (token) => authentication.session.accept(token),
      accessToken: async () => await authentication.session.anonymousAccessToken(),
      client: createShortCodeClient(authentication.api),
    }
  );

  if (result.outcome === "success") {
    redirect(303, event.url.pathname + "?result=success");
  }
  if (result.outcome === "invalid") {
    redirect(303, event.url.pathname + "?result=invalid");
  }

  return fail(result.outcome === "validation-error" ? 400 : 503, {
    shortCode: result.model,
  });
}

function successMessage(journey: ShortCodeJourney, t: TFunction<"common">): string {
  if (journey === "register") {
    return t("authFlow.feedback.registrationCompleted");
  }
  if (journey === "email-update") {
    return t("authFlow.feedback.emailUpdated");
  }
  return t("authFlow.feedback.passwordReset");
}
