import { mergeConfig } from "vite";

import type { StorybookConfig } from "@storybook/sveltekit";

const config: StorybookConfig = {
  addons: ["@a-novel-kit/uikit-storybook"],
  framework: "@storybook/sveltekit",
  staticDirs: ["../static"],
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|ts|svelte)"],
  viteFinal: (config) => mergeConfig(config, { optimizeDeps: { include: ["@a-novel-kit/uikit-storybook"] } }),
};

export default config;
