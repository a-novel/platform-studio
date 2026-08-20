const shortCodeResponseHeaders = {
  "cache-control": "no-store",
  "referrer-policy": "no-referrer",
  "x-robots-tag": "noindex, nofollow",
} as const;

export function secureShortCodeResponse(response: Response): Response {
  for (const [name, value] of Object.entries(shortCodeResponseHeaders)) {
    response.headers.set(name, value);
  }

  return response;
}
