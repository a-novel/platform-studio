const shortCodeResponseHeaders = {
  "cache-control": "no-store",
  // Strip link secrets while preserving the Origin header used to check native form submissions.
  "referrer-policy": "strict-origin",
  "x-robots-tag": "noindex, nofollow",
} as const;

/** Keeps an email-link response out of caches, search indexes and referrers. */
export function secureShortCodeResponse(response: Response): Response {
  for (const [name, value] of Object.entries(shortCodeResponseHeaders)) {
    response.headers.set(name, value);
  }

  return response;
}
