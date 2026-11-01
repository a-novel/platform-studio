import { downtimeUrl, downtimes } from "./tests/e2e/downtime";

import { SvelteKitPlaywright } from "@a-novel-kit/nodelib-config/playwright";

import { defineConfig } from "playwright/test";

/** Configures the Studio server that reads one downtime state. */
function studioServer(state: string, port: number) {
  return SvelteKitPlaywright({
    port,
    serverEnvironment: {
      ACCOUNT_URL: "https://account.example.test",
      AUTHENTICATION_SERVICE_URL: "http://127.0.0.1:14100",
      DOWNTIME_URL: downtimeUrl(state),
    },
    screenshotStyle: "./tests/e2e/screenshots.css",
  });
}

const configs = Object.entries(downtimes).map(([state, { port }]) => studioServer(state, port));

export default defineConfig({
  ...configs[0],
  globalSetup: ["./tests/e2e/setup.ts", "./tests/e2e/downtime.ts"],
  // The first server builds the application, and the downtime variants serve that same build.
  webServer: configs
    .flatMap(({ webServer }) => webServer ?? [])
    .map((server, index) => (index ? { ...server, command: "node build" } : server)),
  // The outage journey briefly stops the shared, disposable authentication service.
  workers: 1,
});
