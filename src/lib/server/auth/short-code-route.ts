import type { ShortCodePageData } from "$lib/application/auth/short-code-route";
import type { ShortCodeJourney } from "$lib/application/auth/types";

import { createAuthenticationContext } from "./context";
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
  return {
    links: {
      continueHref: routeDetails[journey].continueHref,
      restartHref: routeDetails[journey].restartHref,
    },
    model: readShortCodeModel(journey, event.url),
  };
}

export async function submitShortCodeRoute(journey: ShortCodeJourney, event: RequestEvent) {
  const authentication = createAuthenticationContext(event.cookies, event.url);
  const result = await completeShortCode(journey, event.url, await event.request.formData(), {
    accept: (token, identityEmail) => authentication.session.accept(token, identityEmail),
    accessToken: async () => await authentication.session.anonymousAccessToken(),
    client: createShortCodeClient(authentication.api),
    rememberIdentity: (identityEmail) => authentication.session.rememberIdentity(identityEmail),
  });

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
