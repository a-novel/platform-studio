/** A validation problem tied to one named form control. */
export interface FormIssue<Field extends string> {
  field: Field;
  message: string;
}

/** Serializable states shared by progressively enhanced forms. */
export type FormState<Field extends string> =
  | { status: "ready" }
  | { status: "submitting" }
  | { status: "validation-error"; issues: readonly FormIssue<Field>[] }
  | { status: "service-error"; message: string }
  | { status: "success"; message: string };

export type AuthenticationJourney = "login" | "register" | "reset";
export type AuthenticationField = "email" | "password";

/** Email delivery acknowledgement that deliberately does not disclose account existence. */
export interface PendingEmailState {
  status: "pending-email";
  targetHint: string;
}

/** Pure login form state. */
export interface LoginPanelModel {
  journey: "login";
  state: FormState<AuthenticationField>;
}

/** Pure registration or password-recovery request state. */
export interface EmailRequestPanelModel {
  journey: "register" | "reset";
  state: FormState<"email"> | PendingEmailState;
}

/** Every state rendered inside the shell authentication dialog. */
export type AuthenticationPanelModel = LoginPanelModel | EmailRequestPanelModel;

export type AccountPasswordField = "currentPassword" | "newPassword" | "confirmPassword";
export type AccountEmailField = "newEmail";

/** Claims and expiry data resolved by the server-side session boundary. */
export interface AccountClaimsSummary {
  userId: string;
  roles: readonly string[];
  accessExpiresAt: string;
  refreshExpiresAt: string;
}

/** Ready account data and independently controlled actions. */
export interface ReadyAccountScreenModel {
  status: "ready";
  claims: AccountClaimsSummary;
  passwordState: FormState<AccountPasswordField>;
  emailState: FormState<AccountEmailField> | PendingEmailState;
  logoutState: "ready" | "submitting" | { status: "service-error"; message: string };
}

/** Every protected account-screen state. */
export type AccountScreenModel = { status: "loading" } | { status: "error"; message: string } | ReadyAccountScreenModel;

/** POST destinations supplied by the SvelteKit account route. */
export interface AccountFormActions {
  password: string;
  email: string;
  logout: string;
}

export type ShortCodeJourney = "register" | "email-update" | "password-reset";
export type ShortCodePasswordField = "newPassword" | "confirmPassword";

/** A secure email-link state. No short code or raw target is part of this model. */
export type ShortCodeState =
  FormState<ShortCodePasswordField> | { status: "missing" } | { status: "invalid" } | { status: "expired" };

/** Pure standalone completion screen driven by a sanitized server model. */
export interface ShortCodeScreenModel {
  journey: ShortCodeJourney;
  state: ShortCodeState;
  targetHint?: string;
}
