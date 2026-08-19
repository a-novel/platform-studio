import { createAuthenticationContext } from "./context";

import type { RequestEvent } from "@sveltejs/kit";
import { redirect } from "@sveltejs/kit";

/** Clears the Studio session and returns the browser to the app shell. */
export function logoutAuthentication(event: Pick<RequestEvent, "cookies" | "url">): never {
  createAuthenticationContext(event.cookies, event.url).session.clear();
  redirect(303, "/");
}
