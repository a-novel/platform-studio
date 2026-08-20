import { resolveLocale } from "$lib/i18n/config";
import { createStudioI18n } from "$lib/i18n/instance";
import { secureShortCodeResponse } from "$lib/server/auth/short-code-response";

import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
  const locale = resolveLocale(event.request.headers.get("accept-language"));

  event.locals.i18n = createStudioI18n(locale);
  event.locals.locale = locale;

  const response = await resolve(event, {
    transformPageChunk: ({ html }) => html.replace("%lang%", locale),
  });

  return event.url.pathname.startsWith("/ext/") ? secureShortCodeResponse(response) : response;
};
