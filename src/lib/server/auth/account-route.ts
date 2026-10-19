import { type AccountActionData, createAccountModel } from "#lib/application/auth/account-action.js";
import { validateEmailUpdate, validatePasswordChange } from "#lib/application/auth/forms.js";
import type { AccountScreenModel } from "#lib/application/auth/types.js";
import { requireAuthorization } from "#lib/server/auth/authorization.js";
import { emailLanguage } from "#lib/server/auth/context.js";
import { logoutAuthentication } from "#lib/server/auth/logout.js";
import { readTokenExpiry } from "#lib/server/auth/session.js";

import { isHttpStatusError } from "@a-novel-kit/nodelib-browser/http";
import { credentialsUpdatePassword, shortCodeCreateEmailUpdate } from "@a-novel/service-authentication-rest";

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

function passwordAction(state: AccountScreenModel["passwordState"]): AccountActionData {
  return { accountAction: { kind: "password", state } };
}

function emailAction(state: AccountScreenModel["emailState"]): AccountActionData {
  return { accountAction: { kind: "email", state } };
}

export const loadAccount = async (event: Pick<RequestEvent, "cookies" | "getClientAddress" | "locals" | "url">) => {
  const { locals } = event;
  const t = locals.i18n.getFixedT(locals.locale, "common");

  try {
    const { session } = await requireAuthorization(event);

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
    // A planned downtime renders as maintenance rather than as the account's own outage state.
    if (isRedirect(error) || isHttpError(error, 403) || (isHttpError(error, 503) && error.body.downtime)) throw error;

    return {
      authorization: "unavailable" as const,
      accountModel: createAccountModel({
        status: "error",
        feedback: "sessionUnavailable",
      }),
    };
  }
};

async function changePassword(event: RequestEvent) {
  const input = validatePasswordChange(await event.request.formData());
  if (!input.success) return fail(400, passwordAction({ status: "validation-error", issues: input.issues }));

  try {
    const { authentication, session } = await requireAuthorization(event);
    await credentialsUpdatePassword(authentication.api, session.accessToken, input.value);
  } catch (error) {
    if (isRedirect(error) || isHttpError(error, 403)) throw error;

    // A 403 from the service means a wrong current password, which the form shows on its field.
    if (isHttpStatusError(error, 403)) {
      const issues = [{ field: "currentPassword", feedback: "invalidCurrentPassword" }] as const;
      return fail(403, passwordAction({ status: "validation-error", issues }));
    }
    return fail(503, passwordAction({ status: "service-error", feedback: "serviceUnavailable" }));
  }

  return passwordAction({ status: "success", feedback: "passwordChanged" });
}

async function requestEmailUpdate(event: RequestEvent) {
  const input = validateEmailUpdate(await event.request.formData());
  if (!input.success) return fail(400, emailAction({ status: "validation-error", issues: input.issues }));

  try {
    const { authentication, session } = await requireAuthorization(event);
    await shortCodeCreateEmailUpdate(authentication.api, session.accessToken, {
      email: input.value.email,
      lang: emailLanguage(event.locals.locale),
    });
  } catch (error) {
    if (isRedirect(error) || isHttpError(error, 403)) throw error;

    return isHttpStatusError(error, 429)
      ? fail(429, emailAction({ status: "service-error", feedback: "tooManyAttempts" }))
      : fail(503, emailAction({ status: "service-error", feedback: "serviceUnavailable" }));
  }

  return emailAction({ status: "pending-email", targetHint: input.value.email });
}

export const accountActions = {
  password: changePassword,
  email: requestEmailUpdate,
  logout: logoutAuthentication,
};
