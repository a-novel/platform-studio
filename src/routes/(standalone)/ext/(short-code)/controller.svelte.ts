import type { ShortCodeActionData, ShortCodePageData } from "$lib/application/auth/short-code-route";
import type { ShortCodeScreenModel } from "$lib/application/auth/types";

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
  /** Starts secure-link completion. */
  submit(): boolean;
}

/** Configuration for the default secure-link controller. */
export interface ShortCodeScreenControllerOptions extends ShortCodeScreenControllerState {
  /** Allows the browser to submit the form after the controller accepts the transition. */
  allowNativeSubmission?: boolean;
}

/** Creates a reactive controller for a standalone secure-link screen. */
export function createShortCodeScreenController({
  model: initialModel,
  action: initialAction,
  restartHref: initialRestartHref,
  continueHref: initialContinueHref,
  allowNativeSubmission = true,
}: ShortCodeScreenControllerOptions): ShortCodeScreenController {
  let state = $state<ShortCodeScreenControllerState>({
    model: initialModel,
    action: initialAction,
    restartHref: initialRestartHref,
    continueHref: initialContinueHref,
  });

  return {
    get state() {
      return state;
    },
    synchronize(nextState) {
      state = nextState;
    },
    submit() {
      if (
        state.model.state.status === "submitting" ||
        state.model.state.status === "success" ||
        state.model.state.status === "missing" ||
        state.model.state.status === "invalid" ||
        state.model.state.status === "expired"
      ) {
        return false;
      }

      state = {
        ...state,
        model: { ...state.model, state: { status: "submitting" } },
      };
      return allowNativeSubmission;
    },
  };
}

/** Maps sanitized SvelteKit route data into the standalone screen contract. */
export function shortCodeControllerState(
  data: ShortCodePageData,
  form?: ShortCodeActionData | null
): ShortCodeScreenControllerState {
  return {
    model: form?.shortCode ?? data.model,
    action: "",
    restartHref: data.links.restartHref,
    continueHref: data.links.continueHref,
  };
}
