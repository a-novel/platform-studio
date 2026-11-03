import { signInHref } from "#lib/application/auth/navigation.js";

import { withNavigationOpen } from "./navigation-state";

import { SvelteURL } from "svelte/reactivity";

import type { OpenController } from "@a-novel-kit/uikit";

/** Session states the shell can render without owning session logic. */
export type ShellSession =
  | { status: "anonymous" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "downtime" }
  | { status: "authenticated"; displayName?: string; initials?: string };

/** Serializable state consumed by the pure Studio shell. */
export interface StudioShellViewModel {
  activeNavigation: "home" | "privacy" | null;
  rail: "expanded" | "collapsed";
  drawerOpen: boolean;
  session: ShellSession;
}

/** State rendered by the Studio shell component. */
export interface StudioShellControllerState {
  model: StudioShellViewModel;
  homeHref: string;
  /** The account page on the account platform, absent while the server cannot read where it lives. */
  accountHref: string | null;
  /** The invitation request on the account platform, absent while the server cannot read where it lives. */
  invitationHref: string | null;
  privacyHref: string;
  logoutAction: string;
}

/** Route-owned state synchronized into the shell after navigation. */
export interface StudioShellRouteState {
  activeNavigation: StudioShellViewModel["activeNavigation"];
  session: ShellSession;
  drawerOpen?: boolean;
}

/** Pure state and transitions consumed by the Studio shell component. */
export interface StudioShellController {
  readonly state: StudioShellControllerState;
  readonly navigationDialog: OpenController;
  /** Native navigation destination for the mobile menu. */
  navigationHref(open: boolean): string;
  /**
   * Starts a sign-in through the account platform that returns to the current page, or to the page a
   * `returnTo` parameter names.
   */
  signInHref(): string;
  /** Switches between the expanded and collapsed navigation rail. */
  toggleRail(): void;
  /** Requests logout and reports whether native form submission should continue. */
  logout(): boolean;
  /** Reconciles route-owned state after navigation. */
  synchronizeRoute(state: StudioShellRouteState): void;
  /** Reconciles the persisted navigation-rail preference. */
  synchronizeRail(rail: StudioShellViewModel["rail"]): void;
}

/** Configuration for the default Studio shell controller. */
export interface StudioShellControllerOptions extends StudioShellControllerState {
  /** Allows the browser to submit the logout form after the controller accepts it. */
  allowNativeLogout?: boolean;
  /** Observes accepted navigation-rail changes. */
  onRailChange?: (rail: StudioShellViewModel["rail"]) => void;
  /** Current base-resolved route, including query and fragment state. */
  getUrl?: () => URL;
  /** Observes accepted mobile-menu changes. */
  onDrawerChange?: (open: boolean) => void;
}

/** Creates a reactive controller for the Studio application shell. */
export function createStudioShellController({
  model: initialModel,
  homeHref,
  accountHref,
  invitationHref,
  privacyHref,
  logoutAction,
  allowNativeLogout = true,
  onRailChange,
  getUrl = () => new SvelteURL(homeHref, "https://studio.invalid"),
  onDrawerChange,
}: StudioShellControllerOptions): StudioShellController {
  let model = $state(initialModel);

  function setDrawerOpen(open: boolean) {
    if (model.drawerOpen === open) return;
    model = { ...model, drawerOpen: open };
    onDrawerChange?.(open);
  }

  function href(url: URL) {
    return url.pathname + url.search + url.hash;
  }

  const navigationDialog: OpenController = {
    get state() {
      return { open: model.drawerOpen };
    },
    open: () => setDrawerOpen(true),
    close: () => setDrawerOpen(false),
    toggle: () => setDrawerOpen(!model.drawerOpen),
  };

  return {
    get state() {
      return { model, homeHref, accountHref, invitationHref, privacyHref, logoutAction };
    },
    navigationDialog,
    navigationHref: (open) => href(withNavigationOpen(getUrl(), open)),
    signInHref() {
      const url = withNavigationOpen(getUrl(), false);
      return signInHref(url.searchParams.get("returnTo") ?? href(url));
    },
    toggleRail() {
      const rail = model.rail === "expanded" ? "collapsed" : "expanded";
      model = { ...model, rail };
      onRailChange?.(rail);
    },
    logout() {
      if (model.session.status !== "authenticated") return false;
      if (!allowNativeLogout) model = { ...model, session: { status: "anonymous" } };
      return allowNativeLogout;
    },
    synchronizeRoute(routeState) {
      model = {
        ...model,
        activeNavigation: routeState.activeNavigation,
        session: routeState.session,
        drawerOpen: routeState.drawerOpen ?? model.drawerOpen,
      };
    },
    synchronizeRail(rail) {
      if (model.rail !== rail) model = { ...model, rail };
    },
  };
}
