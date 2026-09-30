import { compose, expect } from "./fixtures";

import { writeFile } from "node:fs/promises";

/** Owns fresh infrastructure for the browser run, including diagnostics and teardown. */
export default async function setup() {
  process.env.COMPOSE_PROJECT_NAME ??= `studio-e2e-${process.pid}`;

  const cleanup = async () => {
    try {
      const { stdout } = await compose("logs", "--no-color");
      await writeFile("integration-services.log", stdout);
    } finally {
      await compose("down", "--volumes", "--remove-orphans");
    }
  };

  try {
    await compose("up", "--detach");
    await expect
      .poll(
        async () => {
          try {
            return (await fetch("http://127.0.0.1:14100/v2/ping")).ok;
          } catch {
            return false;
          }
        },
        { timeout: 60_000, message: "Authentication test service is ready" }
      )
      .toBe(true);
  } catch (error) {
    await cleanup();
    throw error;
  }

  return cleanup;
}
