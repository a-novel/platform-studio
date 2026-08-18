import type { ShortCodePageData } from "$lib/application/auth/short-code-route";
import type { ShortCodeJourney } from "$lib/application/auth/types";
import { getAuthUiCopy } from "$lib/i18n/auth-copy";

import { createAuthenticationContext } from "./context";
import { getAuthFlowCopy } from "./messages";
import { completeShortCode, createShortCodeClient, readShortCodeModel } from "./short-code";

import type { RequestEvent } from "@sveltejs/kit";
import { fail, redirect } from "@sveltejs/kit";

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
  const copy = getAuthUiCopy(t).shortCode;
  const flowCopy = getAuthFlowCopy(t);

  return {
    copy,
    links: {
      continueHref: routeDetails[journey].continueHref,
      homeHref: "/",
      restartHref: routeDetails[journey].restartHref,
    },
    model: readShortCodeModel(journey, event.url, successMessage(journey, flowCopy.feedback)),
    pageTitle: journeyTitle(journey, copy),
  };
}

export async function submitShortCodeRoute(journey: ShortCodeJourney, event: RequestEvent) {
  const t = event.locals.i18n.getFixedT(event.locals.locale, "common");
  const flowCopy = getAuthFlowCopy(t);
  const authentication = createAuthenticationContext(event.cookies, event.url);
  const result = await completeShortCode(
    journey,
    event.url,
    await event.request.formData(),
    flowCopy.validation,
    flowCopy.feedback.serviceUnavailable,
    successMessage(journey, flowCopy.feedback),
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

function journeyTitle(journey: ShortCodeJourney, copy: ReturnType<typeof getAuthUiCopy>["shortCode"]): string {
  if (journey === "register") return copy.journeys.register.title;
  if (journey === "email-update") return copy.journeys.emailUpdate.title;
  return copy.journeys.passwordReset.title;
}

function successMessage(journey: ShortCodeJourney, feedback: ReturnType<typeof getAuthFlowCopy>["feedback"]): string {
  if (journey === "register") return feedback.registrationCompleted;
  if (journey === "email-update") return feedback.emailUpdated;
  return feedback.passwordReset;
}
