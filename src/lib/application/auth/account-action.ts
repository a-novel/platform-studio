import type {
  AccountEmailField,
  AccountPasswordField,
  AccountScreenModel,
  FormState,
  ReadyAccountScreenModel,
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
  if (model.status !== "ready" || !data || typeof data !== "object" || !("accountAction" in data)) return model;

  const action = (data as AccountActionData).accountAction;
  if (action.kind === "password") return { ...model, passwordState: action.state };
  if (action.kind === "email") return { ...model, emailState: action.state };

  return model;
}

export function readyAccountModel(
  model: Omit<ReadyAccountScreenModel, "emailState" | "logoutState" | "passwordState">
): ReadyAccountScreenModel {
  return {
    ...model,
    emailState: { status: "ready" },
    logoutState: "ready",
    passwordState: { status: "ready" },
  };
}
