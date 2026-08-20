/** Authentication views represented in the shareable URL state. */
export type AuthDialogView = "login" | "register" | "reset";

/** Session states the shell can render without owning session logic. */
export type ShellSession =
  | { status: "anonymous" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "authenticated"; displayName: string; initials?: string };

/** Serializable state consumed by the pure Studio shell. */
export interface StudioShellViewModel {
  activeNavigation: "home" | null;
  rail: "expanded" | "collapsed";
  drawerOpen: boolean;
  authView: AuthDialogView | null;
  session: ShellSession;
}
