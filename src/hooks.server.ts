import { resolveLocale } from "#lib/i18n/config.js";
import { createStudioI18n } from "#lib/i18n/instance.js";
import { secureShortCodeResponse } from "#lib/server/auth/short-code-response.js";

import type { RequestEvent } from "@sveltejs/kit";
import type { Handle } from "@sveltejs/kit/hooks";

/**
 * Gives each request its own locale and translations, hands its trace to the page, and keeps
 * email-link pages out of caches and referrers.
 */
export const handle: Handle = async ({ event, resolve }) => {
  const locale = resolveLocale(event.request.headers.get("accept-language"));

  event.locals.i18n = createStudioI18n(locale);
  event.locals.locale = locale;

  const trace = pageTrace(event);
  const response = await resolve(event, {
    transformPageChunk: ({ html }) => html.replace("%lang%", locale).replace("%trace%", trace),
  });

  return event.url.pathname.startsWith("/ext/") ? secureShortCodeResponse(response) : response;
};

// The browser's page load continues the request's trace from this tag, as `traceId-spanId-sampled`.
function pageTrace({ tracing }: RequestEvent): string {
  if (!tracing.enabled) return "";

  const { traceId, spanId, traceFlags } = tracing.root.spanContext();
  return `${traceId}-${spanId}-${traceFlags & 1}`;
}
