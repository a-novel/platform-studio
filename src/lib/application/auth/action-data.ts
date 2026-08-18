import type { AuthDialogView } from "$lib/application/shell/types";

import type { AuthenticationPanelModel } from "./types";

export interface AuthenticationActionData {
  authentication?: AuthenticationPanelModel;
}

export function readAuthenticationActionModel(data: unknown, journey: AuthDialogView): AuthenticationPanelModel | null {
  if (!data || typeof data !== "object" || !("authentication" in data)) return null;

  const model = (data as AuthenticationActionData).authentication;
  return model?.journey === journey ? model : null;
}
