import { validateEmailRequest, validateInvitationRequest, validateLogin } from "#lib/application/auth/forms.js";
import { safeReturnTo } from "#lib/application/auth/navigation.js";
import type { AuthenticationFeedback, AuthenticationPanelModel } from "#lib/application/auth/types.js";
import { readAuthView } from "#lib/application/shell/auth-dialog-state.js";
import { createAuthenticationContext } from "#lib/server/auth/context.js";
import { refuseDuringDowntime } from "#lib/server/downtime.js";

import { isHttpStatusError } from "@a-novel-kit/nodelib-browser/http";
import {
  Lang,
  WaitlistJoinConflictError,
  shortCodeCreatePasswordReset,
  waitlistJoin,
} from "@a-novel/service-authentication-rest";

import type { RequestEvent } from "@sveltejs/kit";
import { fail, redirect } from "@sveltejs/kit";

function serviceError(
  journey: AuthenticationPanelModel["journey"],
  feedback: AuthenticationFeedback
): AuthenticationPanelModel {
  return {
    journey,
    state: { status: "service-error", feedback },
  } as AuthenticationPanelModel;
}

/** Fails the action as unavailable, or as rate-limited when authentication refused the caller. */
function failService(journey: AuthenticationPanelModel["journey"], error: unknown) {
  return isHttpStatusError(error, 429)
    ? fail(429, { authentication: serviceError(journey, "tooManyAttempts") })
    : fail(503, { authentication: serviceError(journey, "serviceUnavailable") });
}

async function login(event: RequestEvent, form: FormData) {
  const input = validateLogin(form);

  if (!input.success) {
    return fail(400, {
      authentication: {
        journey: "login",
        state: { status: "validation-error", issues: input.issues },
      } satisfies AuthenticationPanelModel,
    });
  }

  try {
    await createAuthenticationContext(event).session.login(input.value.email, input.value.password);
  } catch (error) {
    if (isHttpStatusError(error, 401)) {
      return fail(401, { authentication: serviceError("login", "invalidCredentials") });
    }
    return failService("login", error);
  }

  redirect(303, safeReturnTo(event.url.searchParams.get("returnTo")));
}

async function requestInvitation(event: RequestEvent, form: FormData) {
  const input = validateInvitationRequest(form);

  if (!input.success) {
    return fail(400, {
      authentication: {
        journey: "register",
        state: { status: "validation-error", issues: input.issues },
      } satisfies AuthenticationPanelModel,
    });
  }

  try {
    const authentication = createAuthenticationContext(event);
    const accessToken = await authentication.session.anonymousAccessToken();
    await waitlistJoin(authentication.api, accessToken, {
      email: input.value.email,
      lang: event.locals.locale === "fr" ? Lang.Fr : Lang.En,
    });
  } catch (error) {
    if (error instanceof WaitlistJoinConflictError) {
      return fail(409, {
        authentication: {
          journey: "register",
          state: { status: "conflict", code: error.code },
        } satisfies AuthenticationPanelModel,
      });
    }
    return failService("register", error);
  }

  return {
    authentication: {
      journey: "register",
      state: {
        status: "recorded",
        email: input.value.email,
      },
    } satisfies AuthenticationPanelModel,
  };
}

async function requestPasswordReset(event: RequestEvent, form: FormData) {
  const input = validateEmailRequest(form);

  if (!input.success) {
    return fail(400, {
      authentication: {
        journey: "reset",
        state: { status: "validation-error", issues: input.issues },
      } satisfies AuthenticationPanelModel,
    });
  }

  try {
    const authentication = createAuthenticationContext(event);
    const accessToken = await authentication.session.anonymousAccessToken();
    await shortCodeCreatePasswordReset(authentication.api, accessToken, {
      email: input.value.email,
      lang: event.locals.locale === "fr" ? Lang.Fr : Lang.En,
    });
  } catch (error) {
    return failService("reset", error);
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
    await refuseDuringDowntime();

    const journey = readAuthView(event.url.searchParams);
    const form = await event.request.formData();

    if (journey === "login") return await login(event, form);
    if (journey === "register") return await requestInvitation(event, form);
    if (journey === "reset") return await requestPasswordReset(event, form);

    return fail(400, {
      authentication: serviceError("login", "serviceUnavailable"),
    });
  },
};
