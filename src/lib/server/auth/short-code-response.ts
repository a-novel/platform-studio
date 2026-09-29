const shortCodeResponseHeaders = {
  "cache-control": "no-store",
  // Strip link secrets while preserving the Origin header used to check native form submissions.
  "referrer-policy": "strict-origin",
  "x-robots-tag": "noindex, nofollow",
} as const;

export function secureShortCodeResponse(response: Response): Response {
  for (const [name, value] of Object.entries(shortCodeResponseHeaders)) {
    response.headers.set(name, value);
  }

  return response;
}
