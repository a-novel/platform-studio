import { type PlatformHealth, aggregateHealth, unavailablePlatformHealth } from "$lib/server/health";
import { getRuntimeConfig } from "$lib/server/runtime-config.server";

import type { RequestHandler } from "./$types";

import { json } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ fetch }) => {
  let health: PlatformHealth;

  try {
    health = await aggregateHealth(fetch, getRuntimeConfig());
  } catch {
    health = unavailablePlatformHealth();
  }

  return json(health, {
    headers: {
      "cache-control": "no-store",
    },
    status: health.status === "up" ? 200 : 503,
  });
};
