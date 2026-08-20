import { loadShortCodeRoute, submitShortCodeRoute } from "$lib/server/auth/short-code-route";

import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = (event) => loadShortCodeRoute("password-reset", event);

export const actions: Actions = {
  default: async (event) => await submitShortCodeRoute("password-reset", event),
};
