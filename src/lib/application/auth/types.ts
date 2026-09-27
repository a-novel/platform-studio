/** Stable product feedback categories translated only at the rendering boundary. */
export type AuthenticationFeedback =
  | "emailUpdated"
  | "invalidCredentials"
  | "invalidCurrentPassword"
  | "passwordChanged"
  | "passwordReset"
  | "registrationCompleted"
  | "serviceUnavailable"
  | "sessionUnavailable";

/** Stable validation categories translated only at the rendering boundary. */
export type AuthenticationValidation =
  "confirmPassword" | "currentPassword" | "email" | "newPassword" | "password" | "passwordMismatch";

/** A validation problem tied to one named form control. */
export interface FormIssue<Field extends string> {
  field: Field;
  feedback: AuthenticationValidation;
}

/** Serializable states shared by progressively enhanced forms. */
export type FormState<Field extends string> =
  | { status: "ready" }
  | { status: "submitting" }
  | { status: "validation-error"; issues: readonly FormIssue<Field>[] }
  | { status: "service-error"; feedback: AuthenticationFeedback }
  | { status: "success"; feedback: AuthenticationFeedback };

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

/** Session recap availability, independent of account form state. */
export type AccountClaimsState =
  | ({ status: "ready" } & AccountClaimsSummary)
  | { status: "loading" }
  | { status: "error"; feedback: AuthenticationFeedback };

/** Account recap and independently controlled actions. */
export interface AccountScreenModel {
  claims: AccountClaimsState;
  passwordState: FormState<AccountPasswordField>;
  emailState: Exclude<FormState<AccountEmailField>, { status: "success" }> | PendingEmailState;
  logoutState: "ready" | "submitting" | { status: "service-error"; feedback: AuthenticationFeedback };
}

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
}
