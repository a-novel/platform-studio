import type { RequestHandler } from "./$types";

import { redirect } from "@sveltejs/kit";

/** Studio opens on the writer's projects: the root address leads there, with its query. */
export const GET: RequestHandler = ({ url }) => redirect(307, `/projects${url.search}`);
