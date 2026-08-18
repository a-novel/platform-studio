import type { StorybookConfig } from "@storybook/sveltekit";

const config: StorybookConfig = {
  addons: ["@a-novel-kit/uikit-storybook"],
  framework: "@storybook/sveltekit",
  stories: ["../src/**/*.stories.@(js|ts|svelte)"],
};

export default config;
