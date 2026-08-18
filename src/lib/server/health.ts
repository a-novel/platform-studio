import type { RuntimeConfig } from "./runtime-config";

const authenticationChecks = ["api:jsonKeys", "client:postgres", "client:smtp"] as const;

type AuthenticationCheck = (typeof authenticationChecks)[number];
type HealthStatus = "down" | "up";

interface CheckHealth {
  status: HealthStatus;
}

interface AuthenticationHealth {
  checks: Record<AuthenticationCheck, CheckHealth>;
  status: HealthStatus;
}

export interface PlatformHealth {
  services: {
    authentication: AuthenticationHealth;
  };
  status: HealthStatus;
}

function readStatus(payload: unknown, check: AuthenticationCheck): HealthStatus {
  if (typeof payload !== "object" || payload === null) {
    return "down";
  }

  const value = Reflect.get(payload, check);
  if (typeof value !== "object" || value === null) {
    return "down";
  }

  return Reflect.get(value, "status") === "up" ? "up" : "down";
}

function unavailableAuthenticationHealth(): AuthenticationHealth {
  return {
    checks: Object.fromEntries(authenticationChecks.map((check) => [check, { status: "down" }])) as Record<
      AuthenticationCheck,
      CheckHealth
    >,
    status: "down",
  };
}

function platformHealth(authentication: AuthenticationHealth): PlatformHealth {
  return {
    services: {
      authentication,
    },
    status: authentication.status,
  };
}

export function unavailablePlatformHealth(): PlatformHealth {
  return platformHealth(unavailableAuthenticationHealth());
}

async function fetchAuthenticationHealth(
  fetchImplementation: typeof globalThis.fetch,
  config: RuntimeConfig
): Promise<AuthenticationHealth> {
  try {
    const baseUrl = config.authenticationServiceUrl.endsWith("/")
      ? config.authenticationServiceUrl
      : `${config.authenticationServiceUrl}/`;
    const response = await fetchImplementation(new URL("healthcheck", baseUrl), {
      headers: {
        accept: "application/json",
      },
      signal: AbortSignal.timeout(config.healthcheckTimeoutMs),
    });
    const payload: unknown = await response.json();
    const checks = Object.fromEntries(
      authenticationChecks.map((check) => [check, { status: readStatus(payload, check) }])
    ) as Record<AuthenticationCheck, CheckHealth>;
    const allChecksUp = authenticationChecks.every((check) => checks[check].status === "up");

    return {
      checks,
      status: response.ok && allChecksUp ? "up" : "down",
    };
  } catch {
    return unavailableAuthenticationHealth();
  }
}

export async function aggregateHealth(
  fetchImplementation: typeof globalThis.fetch,
  config: RuntimeConfig
): Promise<PlatformHealth> {
  const authentication = await fetchAuthenticationHealth(fetchImplementation, config);

  return platformHealth(authentication);
}
