import type { AccountScreenModel } from "$lib/application/auth/types";
import { getAuthUiCopy } from "$lib/i18n/auth-copy";
import { createAuthenticationContext } from "$lib/server/auth/context";
import { maskEmail, validateEmailRequest, validatePasswordChange } from "$lib/server/auth/forms";
import { getAuthFlowCopy } from "$lib/server/auth/messages";
import { readTokenExpiry } from "$lib/server/auth/session";

import type { Actions, PageServerLoad, RequestEvent } from "./$types";

import { isHttpStatusError } from "@a-novel-kit/nodelib-browser/http";
import { Lang, credentialsUpdatePassword, shortCodeCreateEmailUpdate } from "@a-novel/service-authentication-rest";

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

export const load: PageServerLoad = async ({ cookies, locals, url }) => {
  const t = locals.i18n.getFixedT(locals.locale, "common");
  const accountCopy = getAuthUiCopy(t).account;
  const flowCopy = getAuthFlowCopy(t);

  try {
    const authentication = createAuthenticationContext(cookies, url);
    const session = await authentication.session.authenticated();
    if (!session) redirect(303, loginRedirect);

    return {
      accountCopy,
      accountModel: {
        status: "ready",
        claims: {
          userId: session.claims.userID,
          roles: session.claims.roles ?? [],
          accessExpiresAt: formatExpiry(session.accessToken, locals.locale, flowCopy.expiryUnavailable),
          refreshExpiresAt: formatExpiry(session.refreshToken, locals.locale, flowCopy.expiryUnavailable),
        },
        passwordState: { status: "ready" },
        emailState: { status: "ready" },
        logoutState: "ready",
      } satisfies AccountScreenModel,
    };
  } catch (error) {
    if (isRedirect(error)) throw error;

    return {
      accountCopy,
      accountModel: {
        status: "error",
        message: flowCopy.feedback.sessionUnavailable,
      } satisfies AccountScreenModel,
    };
  }
};

export const actions: Actions = {
  password: async (event) => {
    const copy = getAuthFlowCopy(event.locals.i18n.getFixedT(event.locals.locale, "common"));
    const input = validatePasswordChange(await event.request.formData(), copy.validation);

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
            message: isHttpStatusError(error, 403)
              ? copy.feedback.invalidCurrentPassword
              : copy.feedback.serviceUnavailable,
          },
        },
      });
    }

    return {
      accountAction: {
        kind: "password" as const,
        state: { status: "success" as const, message: copy.feedback.passwordChanged },
      },
    };
  },

  email: async (event) => {
    const copy = getAuthFlowCopy(event.locals.i18n.getFixedT(event.locals.locale, "common"));
    const input = validateEmailRequest(await event.request.formData(), copy.validation);

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
            message: copy.feedback.serviceUnavailable,
          },
        },
      });
    }

    return {
      accountAction: {
        kind: "email" as const,
        state: {
          status: "pending-email" as const,
          targetHint: maskEmail(input.value.email),
        },
      },
    };
  },

  logout: (event) => {
    createAuthenticationContext(event.cookies, event.url).session.clear();
    redirect(303, "/");
  },
};
