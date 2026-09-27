import type {
  AccountClaimsState,
  AccountEmailField,
  AccountPasswordField,
  AccountScreenModel,
  FormState,
} from "./types";

export type AccountActionData =
  | {
      accountAction: {
        kind: "email";
        state: FormState<AccountEmailField> | { status: "pending-email"; targetHint: string };
      };
    }
  | { accountAction: { kind: "password"; state: FormState<AccountPasswordField> } };

export function mergeAccountAction(model: AccountScreenModel, data: unknown): AccountScreenModel {
  if (!data || typeof data !== "object" || !("accountAction" in data)) return model;

  const action = (data as AccountActionData).accountAction;
  if (action.kind === "password") return { ...model, passwordState: action.state };
  if (action.kind === "email") return { ...model, emailState: action.state };

  return model;
}

/** Initializes account actions independently of session recap availability. */
export function createAccountModel(claims: AccountClaimsState): AccountScreenModel {
  return {
    claims,
    emailState: { status: "ready" },
    logoutState: "ready",
    passwordState: { status: "ready" },
  };
}
