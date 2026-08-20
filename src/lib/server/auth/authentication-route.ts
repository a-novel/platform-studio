import type { AuthenticationPanelModel } from "$lib/application/auth/types";
import { readAuthView } from "$lib/application/shell/auth-dialog-state";
import { createAuthenticationContext } from "$lib/server/auth/context";
import { safeReturnTo, validateEmailRequest, validateLogin } from "$lib/server/auth/forms";

import { isHttpStatusError } from "@a-novel-kit/nodelib-browser/http";
import { Lang, shortCodeCreatePasswordReset, shortCodeCreateRegister } from "@a-novel/service-authentication-rest";

import type { RequestEvent } from "@sveltejs/kit";
import { fail, redirect } from "@sveltejs/kit";

function serviceError(journey: AuthenticationPanelModel["journey"], message: string): AuthenticationPanelModel {
  return {
    journey,
    state: { status: "service-error", message },
  } as AuthenticationPanelModel;
}

async function login(event: RequestEvent, form: FormData) {
  const t = event.locals.i18n.getFixedT(event.locals.locale, "common");
  const input = validateLogin(form, t);

  if (!input.success) {
    return fail(400, {
      authentication: {
        journey: "login",
        state: { status: "validation-error", issues: input.issues },
      } satisfies AuthenticationPanelModel,
    });
  }

  try {
    await createAuthenticationContext(event.cookies, event.url).session.login(input.value.email, input.value.password);
  } catch (error) {
    const message = isHttpStatusError(error, 401)
      ? t("authFlow.feedback.invalidCredentials")
      : t("authFlow.feedback.serviceUnavailable");
    return fail(isHttpStatusError(error, 401) ? 401 : 503, {
      authentication: serviceError("login", message),
    });
  }

  redirect(303, safeReturnTo(event.url.searchParams.get("returnTo")));
}

async function requestRegistration(event: RequestEvent, form: FormData) {
  const t = event.locals.i18n.getFixedT(event.locals.locale, "common");
  const input = validateEmailRequest(form, t);

  if (!input.success) {
    return fail(400, {
      authentication: {
        journey: "register",
        state: { status: "validation-error", issues: input.issues },
      } satisfies AuthenticationPanelModel,
    });
  }

  try {
    const authentication = createAuthenticationContext(event.cookies, event.url);
    const accessToken = await authentication.session.anonymousAccessToken();
    await shortCodeCreateRegister(authentication.api, accessToken, {
      email: input.value.email,
      lang: event.locals.locale === "fr" ? Lang.Fr : Lang.En,
    });
  } catch {
    return fail(503, {
      authentication: serviceError("register", t("authFlow.feedback.serviceUnavailable")),
    });
  }

  return {
    authentication: {
      journey: "register",
      state: {
        status: "pending-email",
        targetHint: input.value.email,
      },
    } satisfies AuthenticationPanelModel,
  };
}

async function requestPasswordReset(event: RequestEvent, form: FormData) {
  const t = event.locals.i18n.getFixedT(event.locals.locale, "common");
  const input = validateEmailRequest(form, t);

  if (!input.success) {
    return fail(400, {
      authentication: {
        journey: "reset",
        state: { status: "validation-error", issues: input.issues },
      } satisfies AuthenticationPanelModel,
    });
  }

  try {
    const authentication = createAuthenticationContext(event.cookies, event.url);
    const accessToken = await authentication.session.anonymousAccessToken();
    await shortCodeCreatePasswordReset(authentication.api, accessToken, {
      email: input.value.email,
      lang: event.locals.locale === "fr" ? Lang.Fr : Lang.En,
    });
  } catch {
    return fail(503, {
      authentication: serviceError("reset", t("authFlow.feedback.serviceUnavailable")),
    });
  }

  return {
    authentication: {
      journey: "reset",
      state: {
        status: "pending-email",
        targetHint: input.value.email,
      },
    } satisfies AuthenticationPanelModel,
  };
}

export const authenticationActions = {
  default: async (event: RequestEvent) => {
    const journey = readAuthView(event.url.searchParams);
    const form = await event.request.formData();

    if (journey === "login") return await login(event, form);
    if (journey === "register") return await requestRegistration(event, form);
    if (journey === "reset") return await requestPasswordReset(event, form);

    const t = event.locals.i18n.getFixedT(event.locals.locale, "common");
    return fail(400, {
      authentication: serviceError("login", t("authFlow.feedback.serviceUnavailable")),
    });
  },
};
