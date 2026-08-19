import { getAuthUiCopy } from "./auth-copy";
import english from "./locales/en/common.yaml";
import french from "./locales/fr/common.yaml";
import { getStudioShellCopy } from "./shell-copy";

import { type TFunction, createInstance } from "i18next";

function createTranslator(locale: "en" | "fr", common: Record<string, unknown>): TFunction<"common"> {
  const instance = createInstance();
  void instance.init({
    defaultNS: "common",
    fallbackLng: "en",
    initAsync: false,
    lng: locale,
    ns: ["common"],
    resources: {
      [locale]: { common },
    },
  });

  return instance.getFixedT(locale, "common");
}

/** Deterministic localized copy for pure Storybook fixtures. */
export function getAuthStoryCopy(locale: "en" | "fr") {
  const t = createTranslator(locale, locale === "en" ? english : french);
  return {
    auth: getAuthUiCopy(t),
    shell: getStudioShellCopy(t),
  };
}
