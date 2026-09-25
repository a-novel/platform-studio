import type { AccountScreenModel } from "$lib/application/auth/types";
import { createAuthenticationContext } from "$lib/server/auth/context";
import { validateEmailRequest, validatePasswordChange } from "$lib/server/auth/forms";
import { logoutAuthentication } from "$lib/server/auth/logout";
import { readTokenExpiry } from "$lib/server/auth/session";

import { isHttpStatusError } from "@a-novel-kit/nodelib-browser/http";
import { Lang, credentialsUpdatePassword, shortCodeCreateEmailUpdate } from "@a-novel/service-authentication-rest";

import type { RequestEvent } from "@sveltejs/kit";
import { fail, isRedirect, redirect } from "@sveltejs/kit";

const loginRedirect = "/?auth=login&returnTo=%2Faccount";

function formatExpiry(token: string | undefined, locale: string, fallback: string): string {
  const expiry = token ? readTokenExpiry(token) : null;
  if (!expiry) return fallback;

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(expiry);
}

async function authenticated(event: RequestEvent) {
  const authentication = createAuthenticationContext(event.cookies, event.url);
  const session = await authentication.session.authenticated();
  if (!session) redirect(303, loginRedirect);
  return { authentication, session };
}

export const loadAccount = async ({ cookies, locals, url }: Pick<RequestEvent, "cookies" | "locals" | "url">) => {
  const t = locals.i18n.getFixedT(locals.locale, "common");

  try {
    const authentication = createAuthenticationContext(cookies, url);
    const session = await authentication.session.authenticated();
    if (!session) redirect(303, loginRedirect);

    return {
      accountModel: {
        status: "ready",
        claims: {
          userId: session.claims.userID,
          roles: session.claims.roles ?? [],
          accessExpiresAt: formatExpiry(session.accessToken, locals.locale, t("authFlow.expiryUnavailable")),
          refreshExpiresAt: formatExpiry(session.refreshToken, locals.locale, t("authFlow.expiryUnavailable")),
        },
        passwordState: { status: "ready" },
        emailState: { status: "ready" },
        logoutState: "ready",
      } satisfies AccountScreenModel,
    };
  } catch (error) {
    if (isRedirect(error)) throw error;

    return {
      accountModel: {
        status: "error",
        feedback: "sessionUnavailable",
      } satisfies AccountScreenModel,
    };
  }
};

export const accountActions = {
  password: async (event: RequestEvent) => {
    const input = validatePasswordChange(await event.request.formData());

    if (!input.success) {
      return fail(400, {
        accountAction: {
          kind: "password" as const,
          state: { status: "validation-error" as const, issues: input.issues },
        },
      });
    }

    try {
      const { authentication, session } = await authenticated(event);
      await credentialsUpdatePassword(authentication.api, session.accessToken, input.value);
    } catch (error) {
      if (isRedirect(error)) throw error;

      return fail(isHttpStatusError(error, 403) ? 403 : 503, {
        accountAction: {
          kind: "password" as const,
          state: {
            status: "service-error" as const,
            feedback: isHttpStatusError(error, 403) ? "invalidCurrentPassword" : "serviceUnavailable",
          },
        },
      });
    }

    return {
      accountAction: {
        kind: "password" as const,
        state: { status: "success" as const, feedback: "passwordChanged" as const },
      },
    };
  },

  email: async (event: RequestEvent) => {
    const input = validateEmailRequest(await event.request.formData());

    if (!input.success) {
      return fail(400, {
        accountAction: {
          kind: "email" as const,
          state: { status: "validation-error" as const, issues: input.issues },
        },
      });
    }

    try {
      const { authentication, session } = await authenticated(event);
      await shortCodeCreateEmailUpdate(authentication.api, session.accessToken, {
        email: input.value.email,
        lang: event.locals.locale === "fr" ? Lang.Fr : Lang.En,
      });
    } catch (error) {
      if (isRedirect(error)) throw error;

      return fail(503, {
        accountAction: {
          kind: "email" as const,
          state: {
            status: "service-error" as const,
            feedback: "serviceUnavailable" as const,
          },
        },
      });
    }

    return {
      accountAction: {
        kind: "email" as const,
        state: {
          status: "pending-email" as const,
          targetHint: input.value.email,
        },
      },
    };
  },

  logout: logoutAuthentication,
};
