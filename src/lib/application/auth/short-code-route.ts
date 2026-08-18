import type { AuthUiCopy } from "./copy";
import type { ShortCodeScreenModel } from "./types";

export interface ShortCodePageData {
  copy: AuthUiCopy["shortCode"];
  links: {
    continueHref: string;
    homeHref: string;
    restartHref: string;
  };
  model: ShortCodeScreenModel;
  pageTitle: string;
}

export interface ShortCodeActionData {
  shortCode?: ShortCodeScreenModel;
}
