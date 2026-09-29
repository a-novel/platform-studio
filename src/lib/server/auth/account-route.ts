import { createAccountModel } from "$lib/application/auth/account-action";
import { validateEmailUpdate, validatePasswordChange } from "$lib/application/auth/forms";
import { requireAuthorization } from "$lib/server/auth/authorization";
import { logoutAuthentication } from "$lib/server/auth/logout";
import { readTokenExpiry } from "$lib/server/auth/session";

import { isHttpStatusError } from "@a-novel-kit/nodelib-browser/http";
import { Lang, credentialsUpdatePassword, shortCodeCreateEmailUpdate } from "@a-novel/service-authentication-rest";

import type { RequestEvent } from "@sveltejs/kit";
import { fail, isHttpError, isRedirect } from "@sveltejs/kit";

function formatExpiry(token: string | undefined, locale: string, fallback: string): string {
  const expiry = token ? readTokenExpiry(token) : null;
  if (!expiry) return fallback;

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(expiry);
}

export const loadAccount = async ({ cookies, locals, url }: Pick<RequestEvent, "cookies" | "locals" | "url">) => {
  const t = locals.i18n.getFixedT(locals.locale, "common");

  try {
    const { session } = await requireAuthorization({ cookies, url });

    return {
      authorization: "allowed" as const,
      accountModel: createAccountModel({
        status: "ready",
        userId: session.claims.userID,
        roles: session.claims.roles ?? [],
        accessExpiresAt: formatExpiry(session.accessToken, locals.locale, t("authFlow.expiryUnavailable")),
        refreshExpiresAt: formatExpiry(session.refreshToken, locals.locale, t("authFlow.expiryUnavailable")),
      }),
    };
  } catch (error) {
    if (isRedirect(error) || isHttpError(error, 403)) throw error;

    return {
      authorization: "unavailable" as const,
      accountModel: createAccountModel({
        status: "error",
        feedback: "sessionUnavailable",
      }),
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
      const { authentication, session } = await requireAuthorization(event);
      await credentialsUpdatePassword(authentication.api, session.accessToken, input.value);
    } catch (error) {
      if (isRedirect(error) || isHttpError(error, 403)) throw error;

      if (isHttpStatusError(error, 403)) {
        return fail(403, {
          accountAction: {
            kind: "password" as const,
            state: {
              status: "validation-error" as const,
              issues: [{ field: "currentPassword" as const, feedback: "invalidCurrentPassword" as const }],
            },
          },
        });
      }

      return fail(503, {
        accountAction: {
          kind: "password" as const,
          state: {
            status: "service-error" as const,
            feedback: "serviceUnavailable" as const,
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
    const input = validateEmailUpdate(await event.request.formData());

    if (!input.success) {
      return fail(400, {
        accountAction: {
          kind: "email" as const,
          state: { status: "validation-error" as const, issues: input.issues },
        },
      });
    }

    try {
      const { authentication, session } = await requireAuthorization(event);
      await shortCodeCreateEmailUpdate(authentication.api, session.accessToken, {
        email: input.value.email,
        lang: event.locals.locale === "fr" ? Lang.Fr : Lang.En,
      });
    } catch (error) {
      if (isRedirect(error) || isHttpError(error, 403)) throw error;

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
