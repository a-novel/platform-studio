import { aggregateHealth, unavailablePlatformHealth } from "./health";
import type { RuntimeConfig } from "./runtime-config";

import { describe, expect, it, vi } from "vitest";

const config: RuntimeConfig = {
  authenticationServiceUrl: "http://authentication:8080/api",
  healthcheckTimeoutMs: 500,
};

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    status,
  });
}

describe("aggregateHealth", () => {
  it("reports service reachability and preserves its dependency map", async () => {
    const dependencies = {
      "api:jsonKeys": { status: "up" as const },
      "client:postgres": { latencyMs: 7, status: "up" as const },
      "client:smtp": { status: "up" as const },
    };
    const fetchImplementation = vi.fn<typeof globalThis.fetch>(async () => response(dependencies));

    const health = await aggregateHealth(fetchImplementation, config);

    expect(health).toEqual({
      services: {
        authentication: {
          dependencies,
          status: "up",
        },
      },
      status: "up",
    });
    expect(fetchImplementation).toHaveBeenCalledWith(
      new URL("http://authentication:8080/api/healthcheck"),
      expect.objectContaining({
        headers: { accept: "application/json" },
        signal: expect.any(AbortSignal),
      })
    );
  });

  it("keeps a reachable service up while a reported dependency makes Studio unavailable", async () => {
    const dependencies = {
      "api:jsonKeys": { status: "up" as const },
      "client:postgres": { detail: "connection refused", status: "down" as const },
      "client:smtp": { status: "up" as const },
    };
    const fetchImplementation = vi.fn<typeof globalThis.fetch>(async () => response(dependencies));

    const health = await aggregateHealth(fetchImplementation, config);

    expect(health).toEqual({
      services: {
        authentication: {
          dependencies,
          status: "up",
        },
      },
      status: "down",
    });
  });

  it("reports an unavailable service without fabricating dependency checks", async () => {
    const fetchImplementation = vi.fn<typeof globalThis.fetch>(async () => {
      throw new Error("connection details");
    });

    await expect(aggregateHealth(fetchImplementation, config)).resolves.toEqual({
      services: {
        authentication: {
          status: "down",
        },
      },
      status: "down",
    });
  });
});

describe("unavailablePlatformHealth", () => {
  it("reports the configured service as unreachable without fabricated dependencies", () => {
    expect(unavailablePlatformHealth()).toEqual({
      services: {
        authentication: {
          status: "down",
        },
      },
      status: "down",
    });
  });
});
