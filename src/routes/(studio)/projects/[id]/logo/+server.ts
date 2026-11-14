import { getAuthenticationContext } from "#lib/server/auth/context.js";
import { getNarrativeEngine } from "#lib/server/narrative-engine/context.js";

import type { RequestHandler } from "./$types";

import { createHash } from "node:crypto";

import { isHttpStatusError } from "@a-novel-kit/nodelib-browser/http";
import { ProjectLogoGetRequestSchema, projectLogoGet } from "@a-novel/service-narrative-engine-rest";

/**
 * Serves the logo of one of the writer's projects from the narrative engine. Only the project's owner
 * reads it, so caches keep it for that visitor alone. The `v` parameter names the logo's checksum, so a URL
 * whose `v` is the checksum of the bytes served keeps them for good. Any other `v`, as a browser sends while
 * its logo sweep has not seen a change, gets the bytes for this read only: a checksum can come back when the
 * writer uploads an earlier file again, and that URL must then show that file.
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
    const bytes = new Uint8Array(await picture.arrayBuffer());
    const named = event.url.searchParams.get("v") === createHash("sha256").update(bytes).digest("hex");
    return new Response(bytes, {
      headers: {
        "cache-control": named ? "private, max-age=31536000, immutable" : "private, no-cache",
        "content-type": picture.type,
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    return new Response(null, { status: isHttpStatusError(error, 404) ? 404 : 503 });
  }
};
