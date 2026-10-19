import StudioI18nProvider from "../src/lib/i18n/StudioI18nProvider.svelte";
import { type Locale, defaultLocale, supportedLocales } from "../src/lib/i18n/config";
import { storybookLocale } from "../src/lib/i18n/storybook";

import type { Preview } from "@storybook/sveltekit";

const localeNames: Record<Locale, string> = { en: "English", fr: "Français" };

const preview: Preview = {
  initialGlobals: {
    locale: defaultLocale,
  },
  globalTypes: {
    locale: {
      description: "Language",
      toolbar: {
        icon: "globe",
        items: supportedLocales.map((locale) => ({ value: locale, title: localeNames[locale] })),
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (_, context) => ({
      Component: StudioI18nProvider,
      props: { locale: storybookLocale(context.globals) },
    }),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
