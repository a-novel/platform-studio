import {
  AUTHENTICATION_SERVICE_AUDIENCE,
  AUTHENTICATION_SERVICE_URL,
  DOWNTIME_URL,
  HEALTHCHECK_TIMEOUT_MS,
  SERVICE_TOKEN_PATH,
} from "$app/env/private";

import { type RuntimeConfig, parseRuntimeConfig } from "./runtime-config";

/** Parses Studio's private environment, throwing when it is invalid. */
export function getRuntimeConfig(): RuntimeConfig {
  return parseRuntimeConfig({
    AUTHENTICATION_SERVICE_AUDIENCE,
    AUTHENTICATION_SERVICE_URL,
    DOWNTIME_URL,
    HEALTHCHECK_TIMEOUT_MS,
    SERVICE_TOKEN_PATH,
  });
}
