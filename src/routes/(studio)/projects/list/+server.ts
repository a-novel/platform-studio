import { requireAuthorization } from "#lib/server/auth/authorization.js";
import { getNarrativeEngine } from "#lib/server/narrative-engine/context.js";

import { PROJECTS_PAGE } from "../rows";
import type { RequestHandler } from "./$types";

import { projectList } from "@a-novel/service-narrative-engine-rest";

import { error, json } from "@sveltejs/kit";

/**
 * Relays the page of the writer's projects after the first `offset`, as the narrative engine answers it, for the list
 * to load the next projects as the writer scrolls.
 */
export const GET: RequestHandler = async (event) => {
  const offset = Number(event.url.searchParams.get("offset"));
  if (!Number.isSafeInteger(offset) || offset < 0) error(400);

  const { session } = await requireAuthorization(event);
  const page = await projectList(getNarrativeEngine(event), session.accessToken, { limit: PROJECTS_PAGE, offset });
  return json(page);
};
