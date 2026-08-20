import { resolveLocale } from "$lib/i18n/config";

import type { Handle } from "@sveltejs/kit";

export const handle: Handle = ({ event, resolve }) => {
  const locale = resolveLocale(event.request.headers.get("accept-language"));

  event.locals.locale = locale;

  return resolve(event, {
    transformPageChunk: ({ html }) => html.replace("%lang%", locale),
  });
};
