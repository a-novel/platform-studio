import { secureShortCodeResponse } from "./response-security";

import { describe, expect, it } from "vitest";

describe("secureShortCodeResponse", () => {
  it("prevents secret-link responses from being cached, referred, or indexed", () => {
    const response = secureShortCodeResponse(
      new Response("completion", {
        headers: { "content-type": "text/plain" },
      })
    );

    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    expect(response.headers.get("content-type")).toBe("text/plain");
  });
});
