import { SvelteKitPlaywright } from "@a-novel-kit/nodelib-config/playwright";

import { defineConfig } from "playwright/test";

export default defineConfig({
  ...SvelteKitPlaywright({
    port: 4173,
    serverEnvironment: { AUTHENTICATION_SERVICE_URL: "http://127.0.0.1:14100" },
    globalSetup: "./tests/e2e/setup.ts",
    screenshotStyle: "./tests/e2e/screenshots.css",
  }),
  // The outage journey briefly stops the shared, disposable authentication service.
  workers: 1,
});
