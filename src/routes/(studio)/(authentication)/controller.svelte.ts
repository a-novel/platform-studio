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
  /** Requests form submission and reports whether native submission should continue. */
  submit(): boolean;
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
    submit() {
      if (
        model.state.status === "submitting" ||
        model.state.status === "pending-email" ||
        model.state.status === "success"
      ) {
        return false;
      }

      model = { ...model, state: { status: "submitting" } } as AuthenticationPanelModel;
      return allowNativeSubmission;
    },
  };
}
