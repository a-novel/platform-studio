import type { RuntimeConfig } from "./runtime-config";

import { type AggregatedHealth, aggregateHealth as aggregateServiceHealth } from "@a-novel-kit/nodelib-server";

function healthServices(config: RuntimeConfig) {
  return {
    authentication: {
      url: new URL("healthcheck", `${config.authenticationServiceUrl}/`),
    },
  } as const;
}

type PlatformHealthServices = ReturnType<typeof healthServices>;

/** PlatformHealth reports Studio readiness and each product service result. */
export type PlatformHealth = AggregatedHealth<PlatformHealthServices>;

/** Builds the stable failure shape used when Studio cannot load its private configuration. */
export function unavailablePlatformHealth(): PlatformHealth {
  return {
    services: {
      authentication: {
        status: "down",
      },
    },
    status: "down",
  };
}

/** Probes Studio's service registry and preserves each service-owned dependency map. */
export function aggregateHealth(
  fetchImplementation: typeof globalThis.fetch,
  config: RuntimeConfig
): Promise<PlatformHealth> {
  return aggregateServiceHealth({
    fetch: fetchImplementation,
    services: healthServices(config),
    timeoutMs: config.healthcheckTimeoutMs,
  });
}
