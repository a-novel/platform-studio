import StudioI18nProvider from "../src/lib/i18n/StudioI18nProvider.svelte";
import { defaultLocale } from "../src/lib/i18n/config";

import type { Preview } from "@storybook/sveltekit";

const preview: Preview = {
  decorators: [
    (_, context) => ({
      Component: StudioI18nProvider,
      props: {
        locale: context.parameters.locale === "fr" ? "fr" : defaultLocale,
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
