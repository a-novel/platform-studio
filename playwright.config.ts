import { resolve } from "node:path";

import { defineConfig, devices } from "playwright/test";

const baseURL = "http://127.0.0.1:4173";

export default defineConfig({
  testDir: "./tests/e2e",
  snapshotPathTemplate: process.env.PLAYWRIGHT_SNAPSHOT_DIR
    ? `${resolve(process.env.PLAYWRIGHT_SNAPSHOT_DIR)}/{projectName}/{testFilePath}/{arg}{ext}`
    : undefined,
  globalSetup: "./tests/e2e/setup.ts",
  // The outage journey briefly stops the shared, disposable authentication service.
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: { stylePath: "./tests/e2e/screenshots.css" },
  },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    locale: "en-US",
    timezoneId: "UTC",
    reducedMotion: "reduce",
    colorScheme: "dark",
    actionTimeout: 10_000,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "pnpm build && node build",
    url: `${baseURL}/ping`,
    timeout: 120_000,
    reuseExistingServer: false,
    env: {
      HOST: "127.0.0.1",
      PORT: "4173",
      ORIGIN: baseURL,
      AUTHENTICATION_SERVICE_URL: "http://127.0.0.1:14100",
    },
  },
});
