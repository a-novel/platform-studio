import StudioI18nProvider from "./StudioI18nProvider.svelte";
import type { Locale } from "./config";

/** Renders a component test inside the Studio translations of one locale. */
export function withLocale(locale: Locale = "en") {
  return { wrapper: StudioI18nProvider, wrapperProps: { locale } };
}
