import StudioI18nProvider from "../src/lib/i18n/StudioI18nProvider.svelte";
import { defaultLocale, supportedLocales } from "../src/lib/i18n/config";

import type { Preview } from "@storybook/sveltekit";

const preview: Preview = {
  initialGlobals: {
    locale: defaultLocale,
  },
  globalTypes: {
    locale: {
      description: "Language",
      toolbar: {
        icon: "globe",
        items: supportedLocales.map((locale) => ({
          value: locale,
          title: locale === "fr" ? "Français" : "English",
        })),
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (_, context) => ({
      Component: StudioI18nProvider,
      props: {
        locale: context.globals.locale === "fr" ? "fr" : defaultLocale,
      },
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
