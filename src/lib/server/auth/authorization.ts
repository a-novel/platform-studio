import { loginHref } from "$lib/application/auth/navigation";

import { createAuthenticationContext } from "./context";
import type { AuthenticatedSession } from "./session";

import type { RequestEvent } from "@sveltejs/kit";
import { error, redirect } from "@sveltejs/kit";

/**
 * Verifies each protected load or mutation independently. SDK clients and tokens remain server-only.
 * Optional rules restrict a verified account; authentication outages never become anonymous access.
 */
export async function requireAuthorization(
  event: Pick<RequestEvent, "cookies" | "url">,
  when: (session: AuthenticatedSession) => boolean = () => true
) {
  const resolved = await (async () => {
    try {
      const authentication = createAuthenticationContext(event.cookies, event.url);
      return { authentication, session: await authentication.session.authenticated() };
    } catch {
      error(503, "Authentication unavailable");
    }
  })();

  if (!resolved.session) redirect(303, loginHref(event.url.pathname + event.url.search));
  if (!when(resolved.session)) error(403, "Access denied");
  return { authentication: resolved.authentication, session: resolved.session };
}
