import {
  checkClientEnvironment,
  findSecretShapedClientVariables,
  loadClientEnvironment,
} from "./check-client-environment.mjs";

import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("checkClientEnvironment", () => {
  it("allows public client configuration", () => {
    expect(() =>
      checkClientEnvironment({
        VITE_DEPLOYMENT_ENVIRONMENT: "development",
        VITE_PUBLIC_API_ORIGIN: "https://example.test",
      })
    ).not.toThrow();
  });

  it("reports secret-shaped names without exposing their values", () => {
    const environment = {
      VITE_API_KEY: "api-do-not-print",
      VITE_AUTH_TOKEN: "do-not-print",
      VITE_PRIVATE_KEY_PEM: "also-do-not-print",
      SERVER_PASSWORD: "server-only",
    };

    expect(findSecretShapedClientVariables(environment)).toEqual([
      "VITE_API_KEY",
      "VITE_AUTH_TOKEN",
      "VITE_PRIVATE_KEY_PEM",
    ]);
    expect(() => checkClientEnvironment(environment)).toThrow(
      "Secret-shaped client environment variables are forbidden: VITE_API_KEY, VITE_AUTH_TOKEN, VITE_PRIVATE_KEY_PEM"
    );
    expect(() => checkClientEnvironment(environment)).not.toThrow("do-not-print");
  });

  it("loads secret-shaped names from Vite environment files", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "platform-studio-env-"));

    try {
      await writeFile(path.join(directory, ".env"), "VITE_API_KEY=file-secret\n");
      const environment = loadClientEnvironment(directory, {});

      expect(() => checkClientEnvironment(environment)).toThrow(
        "Secret-shaped client environment variables are forbidden: VITE_API_KEY"
      );
      expect(() => checkClientEnvironment(environment)).not.toThrow("file-secret");
    } finally {
      await rm(directory, { recursive: true });
    }
  });
});
