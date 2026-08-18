<script module lang="ts">
  import english from "../locales/en/common.json";
  import french from "../locales/fr/common.json";
  import LocalizationFixture from "./LocalizationFixture.svelte";

  import { defineMeta } from "@storybook/addon-svelte-csf";
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

  const englishTranslator = createTranslator("en", english);
  const frenchTranslator = createTranslator("fr", french);

  const { Story } = defineMeta({
    title: "Foundation/Localization contract",
    tags: ["autodocs"],
    parameters: {
      docs: {
        description: {
          component:
            "A collection fixture proving plain, plural, context, and combined context-plus-plural translation keys.",
        },
      },
    },
  });
</script>

<Story name="English" asChild>
  <LocalizationFixture t={englishTranslator} count={2} perspective="creator" />
</Story>

<Story name="French" asChild>
  <LocalizationFixture t={frenchTranslator} count={1} perspective="reader" />
</Story>
