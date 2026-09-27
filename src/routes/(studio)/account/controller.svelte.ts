import type { AccountFormActions, AccountScreenModel } from "$lib/application/auth/types";

/** State rendered by the account-management component. */
export interface AccountScreenControllerState {
  model: AccountScreenModel;
  actions: AccountFormActions;
}

/** Pure account-management state and form transitions. */
export interface AccountScreenController {
  readonly state: AccountScreenControllerState;
  /** Reconciles a completed route load or action with the rendered account state. */
  synchronize(model: AccountScreenModel, actions: AccountFormActions): void;
  /** Starts a password-change submission. */
  submitPassword(): boolean;
  /** Starts an email-change submission. */
  submitEmail(): boolean;
  /** Starts a logout submission. */
  submitLogout(): boolean;
}

/** Configuration for the default account-management controller. */
export interface AccountScreenControllerOptions extends AccountScreenControllerState {
  /** Allows the browser to submit forms after the controller accepts their transition. */
  allowNativeSubmission?: boolean;
}

/** Creates a reactive controller for the account-management screen. */
export function createAccountScreenController({
  model: initialModel,
  actions: initialActions,
  allowNativeSubmission = true,
}: AccountScreenControllerOptions): AccountScreenController {
  let model = $state(initialModel);
  let actions = $state(initialActions);

  function update(patch: Partial<AccountScreenModel>): boolean {
    model = { ...model, ...patch };
    return allowNativeSubmission;
  }

  return {
    get state() {
      return { model, actions };
    },
    synchronize(nextModel, nextActions) {
      model = nextModel;
      actions = nextActions;
    },
    submitPassword() {
      if (model.passwordState.status === "submitting") return false;
      return update({ passwordState: { status: "submitting" } });
    },
    submitEmail() {
      if (model.emailState.status === "submitting") return false;
      return update({ emailState: { status: "submitting" } });
    },
    submitLogout() {
      if (model.logoutState === "submitting") return false;
      return update({ logoutState: "submitting" });
    },
  };
}
