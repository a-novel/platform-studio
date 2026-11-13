import { getAuthenticationContext } from "#lib/server/auth/context.js";
import { getNarrativeEngine } from "#lib/server/narrative-engine/context.js";

import type { RequestHandler } from "./$types";

import { isHttpStatusError } from "@a-novel-kit/nodelib-browser/http";
import { ProjectLogoGetRequestSchema, projectLogoGet } from "@a-novel/service-narrative-engine-rest";

/**
 * Serves the logo of one of the writer's projects from the narrative engine. Only the project's owner
 * reads it, so caches keep it for that visitor alone. The `v` parameter names the logo's checksum, so
 * a URL that carries it keeps one image for good.
 */
export const GET: RequestHandler = async (event) => {
  const request = ProjectLogoGetRequestSchema.safeParse({
    projectID: event.params.id,
  });
  if (!request.success) return new Response(null, { status: 404 });

  try {
    const session = await getAuthenticationContext(event).session.authenticated();
    if (!session) return new Response(null, { status: 401 });

    const picture = await projectLogoGet(getNarrativeEngine(event), session.accessToken, request.data);
    return new Response(picture, {
      headers: {
        "cache-control": event.url.searchParams.has("v") ? "private, max-age=31536000, immutable" : "private, no-cache",
        "content-type": picture.type,
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    return new Response(null, { status: isHttpStatusError(error, 404) ? 404 : 503 });
  }
};
