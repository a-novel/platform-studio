import { relay } from "../relay.server";
import type { RequestHandler } from "./$types";

import { ProjectFieldsDriftRequestSchema, projectFieldsDrift } from "@a-novel/service-narrative-engine-rest";

/** Relays the fields sweep: the fields of each of the writer's projects that drifted from those the browser holds. */
export const POST: RequestHandler = async (event) => {
  const request = ProjectFieldsDriftRequestSchema.safeParse(await event.request.json().catch(() => undefined));
  if (!request.success) return new Response(null, { status: 400 });

  return relay(event, (api, accessToken) => projectFieldsDrift(api, accessToken, request.data));
};
