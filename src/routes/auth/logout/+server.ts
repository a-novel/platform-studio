import { createAuthenticationContext } from "$lib/server/auth/context";

import type { RequestHandler } from "./$types";

import { redirect } from "@sveltejs/kit";

export const POST: RequestHandler = ({ cookies, url }) => {
  createAuthenticationContext(cookies, url).session.clear();
  redirect(303, "/");
};
