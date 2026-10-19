import type { Locale } from "#lib/i18n/config.js";
import { getRuntimeConfig } from "#lib/server/runtime-config.server.js";
import { serviceFetch } from "#lib/server/service-fetch.js";

import { AuthenticationSession, createSessionClient } from "./session";

import { AuthenticationApi, Lang } from "@a-novel/service-authentication-rest";

import type { RequestEvent } from "@sveltejs/kit";

export interface AuthenticationContext {
  api: AuthenticationApi;
  session: AuthenticationSession;
}

/** AuthenticationEvent is the part of a request the authentication context reads. */
export type AuthenticationEvent = Pick<RequestEvent, "cookies" | "getClientAddress" | "url">;

/** Creates the authentication client and session for one visitor's request. */
export function createAuthenticationContext(event: AuthenticationEvent): AuthenticationContext {
  const config = getRuntimeConfig();
  const api = new AuthenticationApi(
    config.authenticationServiceUrl,
    serviceFetch({ audience: config.authenticationServiceAudience, visitorAddress: event.getClientAddress() })
  );

  return {
    api,
    session: new AuthenticationSession(createSessionClient(api), event.cookies, event.url),
  };
}

/** Picks the language the authentication service writes the visitor's emails in. */
export function emailLanguage(locale: Locale): Lang {
  return locale === "fr" ? Lang.Fr : Lang.En;
}
