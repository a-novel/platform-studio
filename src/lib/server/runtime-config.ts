import {
  type EnvironmentOutput,
  type EnvironmentSource,
  environmentHttpUrl,
  environmentInteger,
  parseEnvironment,
} from "@a-novel-kit/nodelib-server";

const runtimeEnvironmentSchema = {
  authenticationServiceUrl: environmentHttpUrl("AUTHENTICATION_SERVICE_URL"),
  healthcheckTimeoutMs: environmentInteger("HEALTHCHECK_TIMEOUT_MS", {
    defaultValue: 2000,
    maximum: 10_000,
    minimum: 100,
  }),
} as const;

/** RuntimeConfig contains Studio's private server settings. */
export type RuntimeConfig = EnvironmentOutput<typeof runtimeEnvironmentSchema>;

/** Parses Studio's environment variables without retaining invalid values. */
export function parseRuntimeConfig(environment: EnvironmentSource): RuntimeConfig {
  return parseEnvironment(environment, runtimeEnvironmentSchema);
}
