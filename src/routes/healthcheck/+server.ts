import { getRuntimeConfig } from "#lib/server/runtime-config.server.js";
import { serviceFetch } from "#lib/server/service-fetch.js";

import type { RequestHandler } from "./$types";

import { aggregateHealth } from "@a-novel-kit/nodelib-server";

import { json } from "@sveltejs/kit";

/** Probes Studio's service registry and preserves each service-owned dependency map. */
export const GET: RequestHandler = async ({ fetch }) => {
  const health = await aggregateHealth({
    // The profile service only decorates the rail, which falls back to initials without it, so its
    // outage leaves the platform ready and goes unprobed.
    config: {
      authentication: () => {
        const config = getRuntimeConfig();

        return {
          timeoutMs: config.healthcheckTimeoutMs,
          url: new URL("v2/healthcheck", `${config.authenticationServiceUrl}/`),
        };
      },
      jsonKeys: () => {
        const config = getRuntimeConfig();

        return {
          timeoutMs: config.healthcheckTimeoutMs,
          url: new URL("v2/healthcheck", `${config.jsonKeysServiceUrl}/`),
        };
      },
      narrativeEngine: () => {
        const config = getRuntimeConfig();

        return {
          timeoutMs: config.healthcheckTimeoutMs,
          url: new URL("v1/healthcheck", `${config.narrativeEngineServiceUrl}/`),
        };
      },
    },
    // Probes prove Studio's identity to Authentication and the narrative engine like any call, but are
    // made for no visitor. JSON keys' API is public, so its probe carries no token.
    fetch: async (input, init) => {
      const config = getRuntimeConfig();
      const tokens = [
        [config.authenticationServiceUrl, config.serviceTokenPath],
        [config.narrativeEngineServiceUrl, config.narrativeEngineServiceTokenPath],
      ] as const;
      const serviceTokenPath = tokens.find(([url]) => String(input).startsWith(`${url}/`))?.[1];
      return await serviceFetch({ serviceTokenPath }, fetch)(input, init);
    },
  });

  return json(health, {
    headers: {
      "cache-control": "no-store",
    },
    status: health.status === "up" ? 200 : 503,
  });
};
