import { env } from "$env/dynamic/private";

import { type RuntimeConfig, parseRuntimeConfig } from "./runtime-config";

export function getRuntimeConfig(): RuntimeConfig {
  return parseRuntimeConfig(env);
}
