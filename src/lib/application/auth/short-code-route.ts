import type { ShortCodeScreenModel } from "./types";

export interface ShortCodePageData {
  links: {
    continueHref: string;
    restartHref: string;
  };
  model: ShortCodeScreenModel;
}

export interface ShortCodeActionData {
  shortCode?: ShortCodeScreenModel;
}
