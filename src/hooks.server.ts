import { resolveLocale } from "$lib/i18n/config";
import { createRequestI18n } from "$lib/i18n/instance";

import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
  const locale = resolveLocale(event.request.headers.get("accept-language"));

  event.locals.i18n = await createRequestI18n(locale);
  event.locals.locale = locale;

  return resolve(event, {
    transformPageChunk: ({ html }) => html.replace("%lang%", locale),
  });
};
