import { requireAuthorization } from "#lib/server/auth/authorization.js";
import { getNarrativeEngine } from "#lib/server/narrative-engine/context.js";

import { isHttpStatusError } from "@a-novel-kit/nodelib-browser/http";
import type { NarrativeEngineApi } from "@a-novel/service-narrative-engine-rest";

import { type RequestEvent, json } from "@sveltejs/kit";

/**
 * Asks the narrative engine for the visitor's account, and answers its result as JSON. A failure answers without a
 * body: 429 for a rate limit, 503 for any other. A visitor without an account session gets the sign-in redirect.
 */
export async function relay(
  event: RequestEvent,
  call: (api: NarrativeEngineApi, accessToken: string) => Promise<unknown>
): Promise<Response> {
  const { session } = await requireAuthorization(event);
  try {
    return json(await call(getNarrativeEngine(event), session.accessToken));
  } catch (error) {
    return new Response(null, { status: isHttpStatusError(error, 429) ? 429 : 503 });
  }
}
