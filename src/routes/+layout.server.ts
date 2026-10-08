import { readStudioDowntime } from "#lib/server/downtime.js";

import type { LayoutServerLoad } from "./$types";

import { isDowntimeStarted } from "@a-novel-kit/nodelib-server";

export const load: LayoutServerLoad = async ({ locals }) => {
  const downtime = await readStudioDowntime();

  return {
    locale: locals.locale,
    downtime,
    downtimeStarted: isDowntimeStarted(downtime),
  };
};
