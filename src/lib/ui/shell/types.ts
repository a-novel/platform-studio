/** Authentication views represented in the shareable URL state. */
export type AuthDialogView = "login" | "register" | "reset";

/** Session states the shell can render without owning session logic. */
export type ShellSession =
  | { status: "anonymous" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "authenticated"; displayName: string; initials?: string };

/** Serializable state consumed by the pure Studio shell. */
export interface StudioShellViewModel {
  activeNavigation: "home" | null;
  rail: "expanded" | "collapsed";
  drawerOpen: boolean;
  authView: AuthDialogView | null;
  session: ShellSession;
}

/** Localized copy consumed by the pure Studio shell. */
export interface StudioShellCopy {
  accountMenu: string;
  auth: Record<
    AuthDialogView,
    {
      title: string;
      description: string;
    }
  >;
  backToSignIn: string;
  brand: string;
  closeAuthentication: string;
  closeNavigation: string;
  collapseNavigation: string;
  createAccount: string;
  expandNavigation: string;
  forgotPassword: string;
  formPlaceholder: string;
  home: string;
  homeTitle: string;
  logout: string;
  manageAccount: string;
  navigation: string;
  openNavigation: string;
  retrySession: string;
  sessionLoading: string;
  signIn: string;
  signInInstead: string;
  skipToContent: string;
}
