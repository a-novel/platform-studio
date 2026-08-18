import { aggregateHealth } from "./health";
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
  it("reports the authentication service up only when every known check is up", async () => {
    const fetchImplementation = vi.fn<typeof globalThis.fetch>(async () =>
      response({
        "api:jsonKeys": { status: "up" },
        "client:postgres": { status: "up" },
        "client:smtp": { status: "up" },
        internal: { detail: "must not escape" },
      })
    );

    const health = await aggregateHealth(fetchImplementation, config);

    expect(health).toEqual({
      services: {
        authentication: {
          checks: {
            "api:jsonKeys": { status: "up" },
            "client:postgres": { status: "up" },
            "client:smtp": { status: "up" },
          },
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
    expect(JSON.stringify(health)).not.toContain("must not escape");
  });

  it("preserves sanitized partial failures", async () => {
    const fetchImplementation = vi.fn<typeof globalThis.fetch>(async () =>
      response({
        "api:jsonKeys": { status: "up" },
        "client:postgres": { status: "down", error: "private database detail" },
        "client:smtp": { status: "up" },
      })
    );

    const health = await aggregateHealth(fetchImplementation, config);

    expect(health.status).toBe("down");
    expect(health.services.authentication.checks).toEqual({
      "api:jsonKeys": { status: "up" },
      "client:postgres": { status: "down" },
      "client:smtp": { status: "up" },
    });
    expect(JSON.stringify(health)).not.toContain("private database detail");
  });

  it("returns a stable all-down map when the dependency is unavailable", async () => {
    const fetchImplementation = vi.fn<typeof globalThis.fetch>(async () => {
      throw new Error("connection details");
    });

    await expect(aggregateHealth(fetchImplementation, config)).resolves.toEqual({
      services: {
        authentication: {
          checks: {
            "api:jsonKeys": { status: "down" },
            "client:postgres": { status: "down" },
            "client:smtp": { status: "down" },
          },
          status: "down",
        },
      },
      status: "down",
    });
  });
});
