import type { WaitlistJoinConflict } from "@a-novel/service-authentication-rest";

/** Stable product feedback categories translated only at the rendering boundary. */
export type AuthenticationFeedback = "invalidCredentials" | "serviceUnavailable" | "tooManyAttempts";

/** Stable validation categories translated only at the rendering boundary. */
export type AuthenticationValidation =
  { feedback: "email" | "password" } | { feedback: "minLength" | "maxLength"; limit: number };

/** A validation problem tied to one named form control. */
export type FormIssue<Field extends string> = AuthenticationValidation & {
  field: Field;
};

/** Serializable states shared by progressively enhanced forms. */
export type FormState<Field extends string> =
  | { status: "ready" }
  | { status: "submitting" }
  | { status: "validation-error"; issues: readonly FormIssue<Field>[] }
  | { status: "service-error"; feedback: AuthenticationFeedback };

/** The journeys the shell authentication dialog offers. */
export type AuthenticationJourney = "login" | "register" | "reset";

/** The fields of the shell authentication forms. */
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

/** Pure password-recovery request state. */
export interface EmailRequestPanelModel {
  journey: "reset";
  state: FormState<"email"> | PendingEmailState;
}

/** Invitation requests acknowledge list membership without implying email delivery. */
export interface InvitationRequestPanelModel {
  journey: "register";
  state: FormState<"email"> | { status: "recorded"; email: string } | ({ status: "conflict" } & WaitlistJoinConflict);
}

/** Every state rendered inside the shell authentication dialog. */
export type AuthenticationPanelModel = LoginPanelModel | EmailRequestPanelModel | InvitationRequestPanelModel;
