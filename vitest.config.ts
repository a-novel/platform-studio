import { fileURLToPath } from "node:url";

import { defineConfig, defineProject } from "vitest/config";

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { sveltekit } from "@sveltejs/kit/vite";
import { playwright } from "@vitest/browser-playwright";

const storybookConfigDirectory = fileURLToPath(new URL("./.storybook", import.meta.url));

export default defineConfig({
  test: {
    coverage: {
      clean: true,
      enabled: true,
      include: ["src/**/*.{svelte,ts}"],
      provider: "v8",
      reporter: ["text", "json", "lcov"],
      reportsDirectory: "coverage",
    },
    expect: {
      requireAssertions: true,
    },
    projects: [
      defineProject({
        plugins: [sveltekit()],
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
          exclude: ["src/**/*.svelte.test.ts"],
        },
      }),
      defineProject({
        plugins: [sveltekit()],
        test: {
          name: "browser",
          include: ["src/**/*.svelte.test.ts"],
          browser: {
            enabled: true,
            headless: true,
            instances: [{ browser: "chromium" }],
            provider: playwright({}),
          },
          coverage: {
            enabled: false,
          },
        },
      }),
      defineProject({
        extends: "./vite.config.ts",
        plugins: [
          storybookTest({
            configDir: storybookConfigDirectory,
            storybookScript: "pnpm storybook",
            storybookUrl: process.env.SB_URL,
          }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            instances: [{ browser: "chromium" }],
            provider: playwright({}),
          },
          coverage: {
            enabled: false,
          },
        },
      }),
    ],
  },
});
