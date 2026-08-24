import { defaultLocale, supportedLocales } from "./config";
import { createStudioI18n } from "./instance";

/** Resolves Storybook interaction labels from the same bundled catalogs as the rendered story. */
export function createStorybookTranslator(globals: Record<string, unknown>) {
  const locale = supportedLocales.find((candidate) => candidate === globals.locale) ?? defaultLocale;
  return createStudioI18n(locale).t;
}
