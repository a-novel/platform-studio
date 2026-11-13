import { relay } from "../relay.server";
import type { RequestHandler } from "./$types";

import { ProjectLogosDriftRequestSchema, projectLogosDrift } from "@a-novel/service-narrative-engine-rest";

/** Relays the logo sweep: the checksum of each of the writer's logos that drifted from those the browser holds. */
export const POST: RequestHandler = async (event) => {
  const request = ProjectLogosDriftRequestSchema.safeParse(await event.request.json().catch(() => undefined));
  if (!request.success) return new Response(null, { status: 400 });

  return relay(event, (api, accessToken) => projectLogosDrift(api, accessToken, request.data));
};
