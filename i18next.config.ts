import { defineConfig } from "i18next-cli";
import I18nextSveltePlugin from "i18next-cli-plugin-svelte";

export default defineConfig({
  locales: ["en", "fr"],
  extract: {
    defaultNS: "common",
    extractFromComments: false,
    functions: ["t", "*.t"],
    generateBasePluralForms: false,
    ignore: ["src/**/*.test.ts", "src/lib/i18n/generated/**"],
    indentation: 2,
    input: ["src/**/*.{svelte,ts}"],
    output: "src/lib/i18n/locales/{{language}}/{{namespace}}.json",
    primaryLanguage: "en",
    removeUnusedKeys: true,
    secondaryLanguages: ["fr"],
    sort: true,
    warnOnConflicts: "error",
  },
  lint: {
    checkConcatenation: "error",
    checkInterpolationParams: true,
    checkPunctuationConcatenation: "error",
  },
  types: {
    basePath: "src/lib/i18n/locales/en",
    input: ["src/lib/i18n/locales/en/**/*.json"],
    output: "src/lib/i18n/generated/i18next.d.ts",
    resourcesFile: "src/lib/i18n/generated/resources.d.ts",
  },
  plugins: [new I18nextSveltePlugin()],
});
