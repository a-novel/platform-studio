import { validateEmailRequest, validateLogin } from "$lib/application/auth/forms";
import type { AuthenticationPanelModel } from "$lib/application/auth/types";

/** State rendered by the authentication form component. */
export interface AuthenticationPanelControllerState {
  model: AuthenticationPanelModel;
  action: string;
}

/** Pure authentication-form state and transitions. */
export interface AuthenticationPanelController {
  readonly state: AuthenticationPanelControllerState;
  /** Reconciles a completed route load or action with the rendered form. */
  synchronize(model: AuthenticationPanelModel, action: string): void;
  /** Validates submitted values, exposes field issues in state, and allows valid native submission. */
  submit(form: FormData): boolean;
}

/** Configuration for the default authentication-form controller. */
export interface AuthenticationPanelControllerOptions extends AuthenticationPanelControllerState {
  /** Allows the browser to submit the form after the controller accepts the transition. */
  allowNativeSubmission?: boolean;
}

/** Creates a reactive controller for a shell authentication form. */
export function createAuthenticationPanelController({
  model: initialModel,
  action: initialAction,
  allowNativeSubmission = true,
}: AuthenticationPanelControllerOptions): AuthenticationPanelController {
  let model = $state(initialModel);
  let action = $state(initialAction);

  return {
    get state() {
      return { model, action };
    },
    synchronize(nextModel, nextAction) {
      model = nextModel;
      action = nextAction;
    },
    submit(form) {
      if (
        model.state.status === "submitting" ||
        model.state.status === "pending-email" ||
        model.state.status === "success"
      ) {
        return false;
      }

      const result = model.journey === "login" ? validateLogin(form) : validateEmailRequest(form);
      if (!result.success) {
        model = { ...model, state: { status: "validation-error", issues: result.issues } } as AuthenticationPanelModel;
        return false;
      }
      model = { ...model, state: { status: "submitting" } } as AuthenticationPanelModel;
      return allowNativeSubmission;
    },
  };
}
