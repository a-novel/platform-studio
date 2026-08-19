import type { RuntimeConfig } from "./runtime-config";
import { getRuntimeConfig } from "./runtime-config.server";

import { aggregateHealth as aggregateServiceHealth } from "@a-novel-kit/nodelib-server";

type RuntimeConfigReader = () => RuntimeConfig;

/** Probes Studio's service registry and preserves each service-owned dependency map. */
export function aggregateHealth(
  fetchImplementation: typeof globalThis.fetch,
  readConfig: RuntimeConfigReader = getRuntimeConfig
) {
  return aggregateServiceHealth({
    config: {
      authentication: () => {
        const config = readConfig();

        return {
          timeoutMs: config.healthcheckTimeoutMs,
          url: new URL("healthcheck", `${config.authenticationServiceUrl}/`),
        };
      },
    },
    fetch: fetchImplementation,
  });
}

/** PlatformHealth reports Studio readiness and each product service result. */
export type PlatformHealth = Awaited<ReturnType<typeof aggregateHealth>>;
