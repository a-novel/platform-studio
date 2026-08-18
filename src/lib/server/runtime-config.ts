import * as v from "valibot";

const runtimeEnvironmentSchema = v.object({
  AUTHENTICATION_SERVICE_URL: v.pipe(v.string(), v.nonEmpty(), v.url()),
  HEALTHCHECK_TIMEOUT_MS: v.optional(
    v.pipe(v.string(), v.regex(/^\d+$/), v.transform(Number), v.integer(), v.minValue(100), v.maxValue(10_000)),
    "2000"
  ),
});

export interface RuntimeConfig {
  authenticationServiceUrl: string;
  healthcheckTimeoutMs: number;
}

export function parseRuntimeConfig(environment: Record<string, string | undefined>): RuntimeConfig {
  const result = v.safeParse(runtimeEnvironmentSchema, environment);

  if (!result.success) {
    const invalidFields = [
      ...new Set(
        result.issues.flatMap((issue) => {
          const field = issue.path?.map((segment) => String(segment.key)).join(".");
          return field ? [field] : [];
        })
      ),
    ].sort();

    throw new Error(
      `Invalid server environment: ${invalidFields.length > 0 ? invalidFields.join(", ") : "unknown field"}`
    );
  }

  const authenticationServiceUrl = new URL(result.output.AUTHENTICATION_SERVICE_URL);
  if (!["http:", "https:"].includes(authenticationServiceUrl.protocol)) {
    throw new Error("Invalid server environment: AUTHENTICATION_SERVICE_URL");
  }

  return {
    authenticationServiceUrl: authenticationServiceUrl.toString().replace(/\/+$/, ""),
    healthcheckTimeoutMs: result.output.HEALTHCHECK_TIMEOUT_MS,
  };
}
