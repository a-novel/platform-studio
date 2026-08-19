import { parseRuntimeConfig } from "./runtime-config";

import { describe, expect, it } from "vitest";

describe("parseRuntimeConfig", () => {
  it("normalizes a valid service URL and default timeout", () => {
    expect(
      parseRuntimeConfig({
        AUTHENTICATION_SERVICE_URL: "https://authentication.example.test/",
      })
    ).toEqual({
      authenticationServiceUrl: "https://authentication.example.test",
      healthcheckTimeoutMs: 2000,
    });
  });

  it("accepts an explicit bounded timeout", () => {
    expect(
      parseRuntimeConfig({
        AUTHENTICATION_SERVICE_URL: "http://authentication:8080",
        HEALTHCHECK_TIMEOUT_MS: "750",
      })
    ).toEqual({
      authenticationServiceUrl: "http://authentication:8080",
      healthcheckTimeoutMs: 750,
    });
  });

  it.each([
    [{}, "AUTHENTICATION_SERVICE_URL"],
    [{ AUTHENTICATION_SERVICE_URL: "postgres://database" }, "AUTHENTICATION_SERVICE_URL"],
    [
      {
        AUTHENTICATION_SERVICE_URL: "http://authentication:8080",
        HEALTHCHECK_TIMEOUT_MS: "99",
      },
      "HEALTHCHECK_TIMEOUT_MS",
    ],
  ])("rejects invalid environment without echoing values", (environment, field) => {
    expect(() => parseRuntimeConfig(environment)).toThrow(`Invalid server environment: ${field}`);
  });
});
