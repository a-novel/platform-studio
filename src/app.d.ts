import type { Locale } from "$lib/i18n/config";

import type { i18n } from "i18next";

declare global {
  namespace App {
    interface Locals {
      i18n: i18n;
      locale: Locale;
    }
  }
}

export {};
