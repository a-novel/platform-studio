import { getRuntimeConfig } from "$lib/server/runtime-config.server";

import { AuthenticationSession, createSessionClient } from "./session";

import { AuthenticationApi } from "@a-novel/service-authentication-rest";

import type { Cookies } from "@sveltejs/kit";

export interface AuthenticationContext {
  api: AuthenticationApi;
  session: AuthenticationSession;
}

export function createAuthenticationContext(cookies: Cookies, requestUrl: URL): AuthenticationContext {
  const api = new AuthenticationApi(getRuntimeConfig().authenticationServiceUrl);

  return {
    api,
    session: new AuthenticationSession(createSessionClient(api), cookies, requestUrl),
  };
}
