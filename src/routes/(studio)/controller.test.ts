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

describe("platform controllers", () => {
  it("owns authentication submission without owning form fields", () => {
    const controller = createAuthenticationPanelController({
      model: readyAuthenticationModel("login"),
      action: "/auth",
      allowNativeSubmission: false,
    });

    expect(controller.submit()).toBe(false);
    expect(controller.state.model).toEqual({ journey: "login", state: { status: "submitting" } });
    expect(controller.submit()).toBe(false);

    controller.synchronize(readyAuthenticationModel("register"), "/register");
    expect(controller.state).toEqual({
      model: { journey: "register", state: { status: "ready" } },
      action: "/register",
    });
  });

  it("keeps account actions independent while sharing one controller", () => {
    const controller = createAccountScreenController({
      model: {
        status: "ready",
        claims: {
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

    expect(controller.submitPassword()).toBe(false);
    expect(controller.submitEmail()).toBe(false);
    expect(controller.submitLogout()).toBe(false);
    expect(controller.state.model).toMatchObject({
      passwordState: { status: "submitting" },
      emailState: { status: "submitting" },
      logoutState: "submitting",
    });

    const nextActions = { ...actions, logout: "/logout" };
    controller.synchronize({ status: "error", feedback: "sessionUnavailable" }, nextActions);
    expect(controller.state).toEqual({
      model: { status: "error", feedback: "sessionUnavailable" },
      actions: nextActions,
    });
    expect(controller.submitPassword()).toBe(false);
    expect(controller.submitEmail()).toBe(false);
    expect(controller.submitLogout()).toBe(false);
  });

  it("owns secure-link submission and rejects unavailable states", () => {
    const controller = createShortCodeScreenController({
      model: { journey: "password-reset", state: { status: "ready" } },
      action: "",
      restartHref: "/restart",
      continueHref: "/",
      allowNativeSubmission: false,
    });

    expect(controller.submit()).toBe(false);
    expect(controller.state.model.state.status).toBe("submitting");

    controller.synchronize({
      ...controller.state,
      model: { journey: "password-reset", state: { status: "expired" } },
    });
    expect(controller.submit()).toBe(false);
    expect(controller.state.model.state.status).toBe("expired");

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

  it("accepts semantic shell transitions and can pin a review state", () => {
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
      lockAuthentication: true,
      allowNativeLogout: false,
      onAuthViewChange,
      onRailChange,
    });

    controller.authenticationDialog.close();
    expect(controller.state.model.authView).toBe("login");
    expect(controller.authenticationDialog.state.open).toBe(true);
    expect(onAuthViewChange).not.toHaveBeenCalled();

    controller.navigationDialog.open();
    controller.toggleRail();
    expect(controller.state.model).toMatchObject({ drawerOpen: true, rail: "collapsed" });
    expect(controller.navigationDialog.state.open).toBe(true);
    expect(onRailChange).toHaveBeenCalledExactlyOnceWith("collapsed");

    controller.navigationDialog.close();
    expect(controller.state.model.drawerOpen).toBe(false);
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
      session: { status: "authenticated", displayName: "Maya Chen" },
    });
    expect(controller.authentication.state.action).toBe("/auth/reset");

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
