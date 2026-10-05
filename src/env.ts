import { defineEnvVars } from "@sveltejs/kit/env";

// parseRuntimeConfig validates these on use, so a misconfigured server still starts and reports
// itself unhealthy instead of failing at boot.
export const variables = defineEnvVars({
  AUTHENTICATION_SERVICE_URL: { schema: (value) => value },
  HEALTHCHECK_TIMEOUT_MS: { schema: (value) => value },
});
