import type { AuthenticationPanelModel } from "$lib/application/auth/types";
import type { AuthDialogView, ShellSession, StudioShellViewModel } from "$lib/application/shell/types";

import type {
  AuthenticationPanelController,
  AuthenticationPanelControllerState,
} from "./(authentication)/controller.svelte";

import type { OpenController } from "@a-novel-kit/uikit";

/** State rendered by the Studio shell component. */
export interface StudioShellControllerState {
  model: StudioShellViewModel;
  homeHref: string;
  accountHref: string;
  logoutAction: string;
}

/** Route-owned state synchronized into the shell after navigation. */
export interface StudioShellRouteState {
  activeNavigation: StudioShellViewModel["activeNavigation"];
  session: ShellSession;
  authView: AuthDialogView | null;
  authentication?: AuthenticationPanelControllerState;
}

/** Pure state and transitions consumed by the Studio shell component. */
export interface StudioShellController {
  readonly state: StudioShellControllerState;
  readonly authentication: AuthenticationPanelController;
  readonly navigationDialog: OpenController;
  readonly authenticationDialog: OpenController;
  /** Shows one authentication journey. */
  openAuthentication(view: AuthDialogView): void;
  /** Switches between the expanded and collapsed navigation rail. */
  toggleRail(): void;
  /** Requests logout and reports whether native form submission should continue. */
  logout(): boolean;
  /** Reconciles route-owned state after navigation or form actions. */
  synchronizeRoute(state: StudioShellRouteState): void;
  /** Reconciles the persisted navigation-rail preference. */
  synchronizeRail(rail: StudioShellViewModel["rail"]): void;
}

/** Configuration for the default Studio shell controller. */
export interface StudioShellControllerOptions extends StudioShellControllerState {
  authentication: AuthenticationPanelController;
  /** Resolves the form state used when the user selects an authentication journey. */
  resolveAuthentication?: (view: AuthDialogView) => AuthenticationPanelControllerState;
  /** Keeps the initial authentication journey pinned for deterministic visual review. */
  lockAuthentication?: boolean;
  /** Keeps the initial navigation-dialog state pinned for deterministic visual review. */
  lockNavigationDialog?: boolean;
  /** Allows the browser to submit the logout form after the controller accepts it. */
  allowNativeLogout?: boolean;
  /** Observes accepted authentication-view changes. */
  onAuthViewChange?: (view: AuthDialogView | null) => void;
  /** Observes accepted navigation-rail changes. */
  onRailChange?: (rail: StudioShellViewModel["rail"]) => void;
}

/** Creates a reactive controller for the Studio application shell. */
export function createStudioShellController({
  model: initialModel,
  homeHref,
  accountHref,
  logoutAction,
  authentication,
  resolveAuthentication,
  lockAuthentication = false,
  lockNavigationDialog = false,
  allowNativeLogout = true,
  onAuthViewChange,
  onRailChange,
}: StudioShellControllerOptions): StudioShellController {
  let model = $state(initialModel);

  function setAuthentication(view: AuthDialogView | null) {
    if (lockAuthentication && view !== model.authView) return;
    if (model.authView === view) return;

    model = { ...model, authView: view };
    if (view) {
      const nextAuthentication = resolveAuthentication?.(view);
      if (nextAuthentication) authentication.synchronize(nextAuthentication.model, nextAuthentication.action);
    }
    onAuthViewChange?.(view);
  }

  function setDrawerOpen(open: boolean) {
    if (lockNavigationDialog && open !== model.drawerOpen) return;
    if (model.drawerOpen !== open) model = { ...model, drawerOpen: open };
  }

  const navigationDialog: OpenController = {
    get state() {
      return { open: model.drawerOpen };
    },
    open: () => setDrawerOpen(true),
    close: () => setDrawerOpen(false),
    toggle: () => setDrawerOpen(!model.drawerOpen),
  };

  const authenticationDialog: OpenController = {
    get state() {
      return { open: model.authView !== null };
    },
    open: () => setAuthentication(model.authView ?? "login"),
    close: () => setAuthentication(null),
    toggle: () => setAuthentication(model.authView === null ? "login" : null),
  };

  return {
    get state() {
      return { model, homeHref, accountHref, logoutAction };
    },
    authentication,
    navigationDialog,
    authenticationDialog,
    openAuthentication: setAuthentication,
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
        authView: routeState.authView,
      };
      if (routeState.authentication) {
        authentication.synchronize(routeState.authentication.model, routeState.authentication.action);
      }
    },
    synchronizeRail(rail) {
      if (model.rail !== rail) model = { ...model, rail };
    },
  };
}

/** Creates the ready authentication model shared by shell controllers and stories. */
export function readyAuthenticationModel(view: AuthDialogView): AuthenticationPanelModel {
  return { journey: view, state: { status: "ready" } } as AuthenticationPanelModel;
}
