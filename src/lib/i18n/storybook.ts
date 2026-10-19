import { type Locale, defaultLocale, supportedLocales } from "./config";
import { createStudioI18n } from "./instance";

/** Reads the locale picked in the Storybook toolbar, falling back to the default one. */
export function storybookLocale(globals: Record<string, unknown>): Locale {
  return supportedLocales.find((candidate) => candidate === globals.locale) ?? defaultLocale;
}

/** Resolves Storybook interaction labels from the same bundled catalogs as the rendered story. */
export function createStorybookTranslator(globals: Record<string, unknown>) {
  return createStudioI18n(storybookLocale(globals)).t;
}
