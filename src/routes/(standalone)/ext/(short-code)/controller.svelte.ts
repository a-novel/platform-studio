import { validateNewPassword } from "#lib/application/auth/forms.js";
import type { ShortCodeActionData, ShortCodePageData } from "#lib/application/auth/short-code-route.js";
import type { ShortCodeScreenModel } from "#lib/application/auth/types.js";

/** State rendered by a standalone secure-link component. */
export interface ShortCodeScreenControllerState {
  model: ShortCodeScreenModel;
  action: string;
  restartHref: string;
  continueHref: string;
}

/** Pure secure-link state and form transitions. */
export interface ShortCodeScreenController {
  readonly state: ShortCodeScreenControllerState;
  /** Reconciles a completed route load or action with the rendered secure-link state. */
  synchronize(state: ShortCodeScreenControllerState): void;
  /** Validates password forms into state before submission. Email confirmation needs no form values. */
  submit(form?: FormData): boolean;
}

/** Configuration for the default secure-link controller. */
export interface ShortCodeScreenControllerOptions extends ShortCodeScreenControllerState {
  /** Allows the browser to submit the form after the controller accepts the transition. */
  allowNativeSubmission?: boolean;
}

/** Creates a reactive controller for a standalone secure-link screen. */
export function createShortCodeScreenController({
  allowNativeSubmission = true,
  ...initialState
}: ShortCodeScreenControllerOptions): ShortCodeScreenController {
  let state = $state<ShortCodeScreenControllerState>(initialState);

  return {
    get state() {
      return state;
    },
    synchronize(nextState) {
      state = nextState;
    },
    submit(form = new FormData()) {
      if (["submitting", "success", "missing", "invalid"].includes(state.model.state.status)) return false;

      if (state.model.journey !== "email-update") {
        const result = validateNewPassword(form);
        if (!result.success) {
          state = { ...state, model: { ...state.model, state: { status: "validation-error", issues: result.issues } } };
          return false;
        }
      }
      state = { ...state, model: { ...state.model, state: { status: "submitting" } } };
      return allowNativeSubmission;
    },
  };
}

/** Maps sanitized SvelteKit route data into the standalone screen contract. */
export function shortCodeControllerState(
  data: ShortCodePageData,
  form?: ShortCodeActionData | null
): ShortCodeScreenControllerState {
  return { model: form?.shortCode ?? data.model, action: "", ...data.links };
}
