import {
  type StudioShellControllerOptions,
  type StudioShellData,
  createStudioShellController,
} from "./controller.svelte";

import { describe, expect, it, vi } from "vitest";

const accountLinks = {
  accountHref: "https://account.example.test/account",
  invitationHref: "https://account.example.test/account?auth=register",
};

const links = {
  homeHref: "/",
  privacyHref: "/privacy",
  logoutAction: "/logout",
};

function shell(options: Partial<StudioShellControllerOptions> = {}) {
  return createStudioShellController({
    getData: () => ({
      activeNavigation: "projects",
      rail: "expanded",
      session: { status: "anonymous" },
      ...accountLinks,
    }),
    ...links,
    allowNativeLogout: false,
    ...options,
  });
}

describe("createStudioShellController", () => {
  it("accepts semantic shell transitions", () => {
    const onRailChange = vi.fn();
    const onDrawerChange = vi.fn();
    let data: StudioShellData = {
      activeNavigation: "projects",
      rail: "expanded",
      session: { status: "anonymous" },
      ...accountLinks,
    };
    const controller = shell({ getData: () => data, onRailChange, onDrawerChange });

    controller.navigationDialog.open();
    expect(onDrawerChange).toHaveBeenCalledExactlyOnceWith(true);
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
    expect(onDrawerChange.mock.calls).toEqual([[true], [false], [true], [false]]);

    data = { ...data, session: { status: "anonymous" } };
    expect(controller.logout()).toBe(false);
    expect(controller.state.model.session).toEqual({ status: "anonymous" });
  });

  it("links the menu and a sign-in that returns to the current page without the open menu", () => {
    let url = new URL("https://studio.example.test/base/?document=42&menu=open#selection");
    const controller = shell({ getUrl: () => url });

    expect(controller.navigationHref(false)).toBe("/base/?document=42#selection");
    expect(controller.navigationHref(true)).toBe("/base/?document=42&menu=open#selection");
    expect(controller.signInHref()).toBe("/auth/sign-in?returnTo=%2Fbase%2F%3Fdocument%3D42%23selection");

    url = new URL("https://studio.example.test/auth/sign-in/failed?returnTo=%2Fprivacy&reason=unavailable");
    expect(controller.signInHref()).toBe("/auth/sign-in?returnTo=%2Fprivacy");
  });

  it("derives the menu from the URL and the rest of the shell from the load data", () => {
    let data: StudioShellData = {
      activeNavigation: "projects",
      rail: "collapsed",
      session: { status: "anonymous" },
      ...accountLinks,
    };
    let url = new URL("https://studio.example.test/?menu=open");
    const controller = shell({ getData: () => data, getUrl: () => url });

    expect(controller.state.model).toEqual({
      activeNavigation: "projects",
      rail: "collapsed",
      drawerOpen: true,
      session: { status: "anonymous" },
    });

    data = {
      activeNavigation: null,
      rail: "collapsed",
      session: { status: "authenticated" },
      accountHref: null,
      invitationHref: null,
    };
    url = new URL("https://studio.example.test/privacy");
    expect(controller.state).toEqual({
      model: { activeNavigation: null, rail: "collapsed", drawerOpen: false, session: { status: "authenticated" } },
      ...links,
      accountHref: null,
      invitationHref: null,
      studioDowntime: undefined,
    });

    expect(controller.logout()).toBe(false);
    expect(controller.state.model.session.status).toBe("anonymous");
  });

  it.each(["authenticated", "loading"] as const)("allows native logout without replacing the %s session", (status) => {
    const controller = shell({
      getData: () => ({
        activeNavigation: "projects",
        rail: "expanded",
        session: { status },
        ...accountLinks,
      }),
      allowNativeLogout: true,
    });

    expect(controller.logout()).toBe(true);
    expect(controller.state.model.session.status).toBe(status);
  });
});
