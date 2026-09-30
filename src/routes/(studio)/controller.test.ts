import { createAccountModel } from "$lib/application/auth/account-action";
import {
  validateEmailRequest,
  validateEmailUpdate,
  validateInvitationRequest,
  validateLogin,
  validateNewPassword,
  validatePasswordChange,
} from "$lib/application/auth/forms";
import type { AccountScreenModel, ShortCodeState } from "$lib/application/auth/types";

import {
  createShortCodeScreenController,
  shortCodeControllerState,
} from "../(standalone)/ext/(short-code)/controller.svelte";
import { createAuthenticationPanelController } from "./(authentication)/controller.svelte";
import { createAccountScreenController } from "./account/controller.svelte";
import { createStudioShellController, readyAuthenticationModel } from "./controller.svelte";

import { describe, expect, it, vi } from "vitest";

const actions = {
  password: "?/password",
  email: "?/email",
  logout: "?/logout",
};

function validForm() {
  const form = new FormData();
  for (const [name, value] of Object.entries({
    email: "creator@example.test",
    password: "new-password",
    confirmPassword: "new-password",
    currentPassword: "old-password",
  }))
    form.set(name, value);
  return form;
}

describe("platform controllers", () => {
  it.each(["login", "register", "reset"] as const)(
    "returns shared validation for %s before accepting corrected input",
    (journey) => {
      const controller = createAuthenticationPanelController({ model: readyAuthenticationModel(journey), action: "/" });
      const invalid = new FormData();
      const validate =
        journey === "login" ? validateLogin : journey === "register" ? validateInvitationRequest : validateEmailRequest;
      const expected = validate(invalid);
      expect(controller.submit(invalid)).toBe(false);
      if (expected.success) throw new Error("Expected invalid form");
      expect(controller.state.model.state).toEqual({ status: "validation-error", issues: expected.issues });
      expect(controller.submit(validForm())).toBe(true);
      expect(controller.state.model.state).toEqual({ status: "submitting" });
      expect(JSON.stringify(controller.state)).not.toContain("new-password");
    }
  );

  it("validates independent account forms without changing other actions", () => {
    const model = createAccountModel({ status: "error", feedback: "sessionUnavailable" });
    const controller = createAccountScreenController({ model, actions });
    const invalid = new FormData();
    for (const [submit, validate, key] of [
      [controller.submitPassword, validatePasswordChange, "passwordState"],
      [controller.submitEmail, validateEmailUpdate, "emailState"],
    ] as const) {
      controller.synchronize(model, actions);
      expect(submit(invalid)).toBe(false);
      const result = validate(invalid);
      if (result.success) throw new Error("Expected invalid form");
      expect(controller.state.model).toEqual({
        ...model,
        [key]: { status: "validation-error", issues: result.issues },
      });
      expect(submit(validForm())).toBe(true);
    }
  });

  it.each(["register", "password-reset"] as const)(
    "validates %s confirmation without retaining passwords",
    (journey) => {
      const controller = createShortCodeScreenController({
        model: { journey, state: { status: "ready" } },
        action: "",
        restartHref: "/",
        continueHref: "/",
      });
      const invalid = validForm();
      invalid.set("confirmPassword", "different-password");
      const result = validateNewPassword(invalid);
      expect(controller.submit(invalid)).toBe(false);
      if (result.success) throw new Error("Expected invalid confirmation");
      expect(controller.state.model.state).toEqual({ status: "validation-error", issues: result.issues });
      expect(controller.submit(validForm())).toBe(true);
      expect(JSON.stringify(controller.state)).not.toContain("new-password");
      expect(JSON.stringify(controller.state)).not.toContain("different-password");
    }
  );

  it("owns authentication submission without owning form fields", () => {
    const controller = createAuthenticationPanelController({
      model: readyAuthenticationModel("login"),
      action: "/auth",
      allowNativeSubmission: false,
    });

    expect(controller.submit(validForm())).toBe(false);
    expect(controller.state.model).toEqual({ journey: "login", state: { status: "submitting" } });
    expect(controller.submit(validForm())).toBe(false);

    controller.synchronize(readyAuthenticationModel("register"), "/register");
    expect(controller.state).toEqual({
      model: { journey: "register", state: { status: "ready" } },
      action: "/register",
    });
  });

  it.each(["register", "reset"] as const)("keeps a completed %s request fixed until navigation", (journey) => {
    const model =
      journey === "register"
        ? ({ journey, state: { status: "recorded", email: "creator@example.test" } } as const)
        : ({ journey, state: { status: "pending-email", targetHint: "creator@example.test" } } as const);
    const controller = createAuthenticationPanelController({ model, action: "/" });
    expect(controller.submit(validForm())).toBe(false);
    expect(controller.state.model).toEqual(model);

    controller.synchronize({ journey, state: { status: "service-error", feedback: "serviceUnavailable" } }, "/retry");
    expect(controller.submit(validForm())).toBe(true);
    expect(controller.submit(validForm())).toBe(false);
    expect(controller.state).toEqual({ model: { journey, state: { status: "submitting" } }, action: "/retry" });
  });

  it.each(["account_exists", "already_waitlisted"] as const)("allows correction after %s", (code) => {
    const controller = createAuthenticationPanelController({
      model: { journey: "register", state: { status: "conflict", code } },
      action: "/?auth=register",
    });
    expect(controller.submit(validForm())).toBe(true);
    expect(controller.submit(validForm())).toBe(false);
    expect(controller.state.model).toEqual({ journey: "register", state: { status: "submitting" } });
  });

  it("keeps account actions independent while sharing one controller", () => {
    const controller = createAccountScreenController({
      model: {
        claims: {
          status: "ready",
          userId: "user-id",
          roles: [],
          accessExpiresAt: "later",
          refreshExpiresAt: "later",
        },
        passwordState: { status: "ready" },
        emailState: { status: "ready" },
        logoutState: "ready",
      },
      actions,
      allowNativeSubmission: false,
    });

    expect(controller.submitPassword(validForm())).toBe(false);
    expect(controller.submitEmail(validForm())).toBe(false);
    expect(controller.submitLogout()).toBe(false);
    expect(controller.state.model).toMatchObject({
      passwordState: { status: "submitting" },
      emailState: { status: "submitting" },
      logoutState: "submitting",
    });

    const nextActions = { ...actions, logout: "/logout" };
    const unavailable = createAccountModel({ status: "error", feedback: "sessionUnavailable" });
    controller.synchronize(unavailable, nextActions);
    expect(controller.state).toEqual({
      model: unavailable,
      actions: nextActions,
    });
    expect(controller.submitPassword(validForm())).toBe(false);
    expect(controller.submitEmail(validForm())).toBe(false);
    expect(controller.submitLogout()).toBe(false);
    expect(controller.state.model).toMatchObject({
      claims: unavailable.claims,
      passwordState: { status: "submitting" },
      emailState: { status: "submitting" },
      logoutState: "submitting",
    });
  });

  it("allows native account submissions when only the recap failed", () => {
    const controller = createAccountScreenController({
      model: createAccountModel({ status: "error", feedback: "sessionUnavailable" }),
      actions,
    });
    for (const submit of [controller.submitPassword, controller.submitEmail, controller.submitLogout]) {
      expect(submit(validForm())).toBe(true);
      expect(submit(validForm())).toBe(false);
    }
  });

  it.each(["completed", "unavailable"] as const)("allows another account change after %s actions", (outcome) => {
    const model: AccountScreenModel = {
      ...createAccountModel({ status: "error", feedback: "sessionUnavailable" }),
      passwordState:
        outcome === "completed"
          ? { status: "success", feedback: "passwordChanged" }
          : { status: "service-error", feedback: "serviceUnavailable" },
      emailState:
        outcome === "completed"
          ? { status: "pending-email", targetHint: "creator@example.test" }
          : { status: "service-error", feedback: "serviceUnavailable" },
    };
    const controller = createAccountScreenController({ model, actions });
    expect(controller.submitPassword(validForm())).toBe(true);
    expect(controller.state.model).toEqual({ ...model, passwordState: { status: "submitting" } });
    controller.synchronize(model, actions);
    expect(controller.submitEmail(validForm())).toBe(true);
    expect(controller.state.model).toEqual({ ...model, emailState: { status: "submitting" } });
    expect(JSON.stringify(controller.state)).not.toContain("new-password");
  });

  it.each<ShortCodeState>([
    { status: "missing" },
    { status: "invalid" },
    { status: "submitting" },
    { status: "success", feedback: "registrationCompleted" },
  ])("preserves a secure link in $status state", (state) => {
    const controller = createShortCodeScreenController({
      model: { journey: "register", state },
      action: "",
      restartHref: "/register",
      continueHref: "/",
    });
    expect(controller.submit(validForm())).toBe(false);
    expect(controller.state.model.state).toEqual(state);
  });

  it("confirms email without password fields and recovers from an outage", () => {
    const controller = createShortCodeScreenController({
      model: { journey: "email-update", state: { status: "ready" } },
      action: "",
      restartHref: "/account",
      continueHref: "/account",
    });
    expect(controller.submit()).toBe(true);
    expect(controller.submit()).toBe(false);
    const next = shortCodeControllerState({
      model: { journey: "email-update", state: { status: "service-error", feedback: "serviceUnavailable" } },
      links: { restartHref: "/?auth=login", continueHref: "/account?panel=email" },
    });
    controller.synchronize(next);
    expect(controller.state).toEqual(next);
    expect(controller.submit()).toBe(true);
    expect(controller.state).toEqual({ ...next, model: { journey: "email-update", state: { status: "submitting" } } });
  });

  it("owns secure-link submission and rejects unavailable states", () => {
    const controller = createShortCodeScreenController({
      model: { journey: "password-reset", state: { status: "ready" } },
      action: "",
      restartHref: "/restart",
      continueHref: "/",
      allowNativeSubmission: false,
    });

    expect(controller.submit(validForm())).toBe(false);
    expect(controller.state.model.state.status).toBe("submitting");

    controller.synchronize({
      ...controller.state,
      model: { journey: "password-reset", state: { status: "invalid" } },
    });
    expect(controller.submit(validForm())).toBe(false);
    expect(controller.state.model.state.status).toBe("invalid");

    expect(
      shortCodeControllerState(
        {
          model: { journey: "register", state: { status: "ready" } },
          links: { restartHref: "/register", continueHref: "/" },
        },
        { shortCode: { journey: "register", state: { status: "success", feedback: "registrationCompleted" } } }
      )
    ).toEqual({
      model: { journey: "register", state: { status: "success", feedback: "registrationCompleted" } },
      action: "",
      restartHref: "/register",
      continueHref: "/",
    });
  });

  it("accepts semantic shell transitions", () => {
    const onAuthViewChange = vi.fn();
    const onRailChange = vi.fn();
    const authentication = createAuthenticationPanelController({
      model: readyAuthenticationModel("login"),
      action: "/auth",
      allowNativeSubmission: false,
    });
    const controller = createStudioShellController({
      model: {
        activeNavigation: "home",
        authView: "login",
        drawerOpen: false,
        rail: "expanded",
        session: { status: "anonymous" },
      },
      homeHref: "/",
      accountHref: "/account",
      logoutAction: "/logout",
      authentication,
      allowNativeLogout: false,
      onAuthViewChange,
      onRailChange,
    });

    controller.authenticationDialog.close();
    expect(controller.state.model.authView).toBeNull();
    expect(controller.authenticationDialog.state.open).toBe(false);
    expect(onAuthViewChange).toHaveBeenCalledExactlyOnceWith(null);

    controller.navigationDialog.open();
    controller.toggleRail();
    expect(controller.state.model).toMatchObject({ drawerOpen: true, rail: "collapsed" });
    expect(controller.navigationDialog.state.open).toBe(true);
    expect(onRailChange).toHaveBeenCalledExactlyOnceWith("collapsed");

    controller.navigationDialog.close();
    expect(controller.state.model.drawerOpen).toBe(false);
    controller.navigationDialog.toggle();
    controller.navigationDialog.open();
    expect(controller.navigationDialog.state.open).toBe(true);
    controller.navigationDialog.toggle();
    expect(controller.navigationDialog.state.open).toBe(false);

    controller.authenticationDialog.open();
    controller.authenticationDialog.open();
    expect(controller.authenticationDialog.state.open).toBe(true);
    expect(onAuthViewChange).toHaveBeenCalledTimes(2);
    controller.authenticationDialog.toggle();
    expect(controller.authenticationDialog.state.open).toBe(false);
    controller.authenticationDialog.toggle();
    expect(controller.state.model.authView).toBe("login");
    expect(onAuthViewChange.mock.calls).toEqual([[null], ["login"], [null], ["login"]]);

    for (const session of [{ status: "anonymous" }, { status: "loading" }, { status: "error" }] as const) {
      controller.synchronizeRoute({ activeNavigation: "home", authView: null, session });
      expect(controller.logout()).toBe(false);
      expect(controller.state.model.session).toEqual(session);
    }
  });

  it("synchronizes route state around accepted shell transitions", () => {
    const onAuthViewChange = vi.fn();
    const authentication = createAuthenticationPanelController({
      model: readyAuthenticationModel("login"),
      action: "/auth/login",
      allowNativeSubmission: false,
    });
    const controller = createStudioShellController({
      model: {
        activeNavigation: "home",
        authView: null,
        drawerOpen: false,
        rail: "expanded",
        session: { status: "anonymous" },
      },
      homeHref: "/",
      accountHref: "/account",
      logoutAction: "/logout",
      authentication,
      resolveAuthentication: (view) => ({
        model: readyAuthenticationModel(view),
        action: `/auth/${view}`,
      }),
      allowNativeLogout: false,
      onAuthViewChange,
    });

    controller.openAuthentication("register");
    expect(controller.state.model.authView).toBe("register");
    expect(controller.authentication.state).toEqual({
      model: { journey: "register", state: { status: "ready" } },
      action: "/auth/register",
    });
    expect(onAuthViewChange).toHaveBeenCalledExactlyOnceWith("register");

    controller.openAuthentication("register");
    controller.authenticationDialog.close();
    expect(onAuthViewChange).toHaveBeenLastCalledWith(null);

    controller.synchronizeRail("collapsed");
    controller.synchronizeRail("collapsed");
    controller.navigationDialog.open();
    expect(controller.state.model.rail).toBe("collapsed");

    controller.synchronizeRoute({
      activeNavigation: null,
      authView: "reset",
      session: { status: "authenticated", displayName: "Maya Chen" },
      authentication: {
        model: readyAuthenticationModel("reset"),
        action: "/auth/reset",
      },
    });
    expect(controller.state.model).toMatchObject({
      activeNavigation: null,
      authView: "reset",
      rail: "collapsed",
      drawerOpen: true,
      session: { status: "authenticated", displayName: "Maya Chen" },
    });
    expect(controller.authentication.state.action).toBe("/auth/reset");
    expect(onAuthViewChange.mock.calls).toEqual([["register"], [null]]);

    expect(controller.logout()).toBe(false);
    expect(controller.state.model.session.status).toBe("anonymous");
  });

  it("allows native logout without replacing the authenticated session", () => {
    const authentication = createAuthenticationPanelController({
      model: readyAuthenticationModel("login"),
      action: "/auth",
    });
    const controller = createStudioShellController({
      model: {
        activeNavigation: "home",
        authView: null,
        drawerOpen: false,
        rail: "expanded",
        session: { status: "authenticated", displayName: "Maya Chen" },
      },
      homeHref: "/",
      accountHref: "/account",
      logoutAction: "/logout",
      authentication,
    });

    expect(controller.logout()).toBe(true);
    expect(controller.state.model.session.status).toBe("authenticated");
  });
});
