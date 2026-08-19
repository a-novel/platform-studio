import { aggregateHealth } from "$lib/server/health";

import type { RequestHandler } from "./$types";

import { json } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ fetch }) => {
  const health = await aggregateHealth(fetch);

  return json(health, {
    headers: {
      "cache-control": "no-store",
    },
    status: health.status === "up" ? 200 : 503,
  });
};
