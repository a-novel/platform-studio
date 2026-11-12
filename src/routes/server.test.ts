import { GET } from "./+server";

import { describe, expect, it } from "vitest";

import { isRedirect } from "@sveltejs/kit";

describe("GET /", () => {
  it.each([
    ["https://studio.test/", "/projects"],
    ["https://studio.test/?nav=open", "/projects?nav=open"],
  ])("redirects %s to the projects", async (address, location) => {
    const event = { url: new URL(address) } as Parameters<typeof GET>[0];

    const result = await Promise.resolve()
      .then(() => GET(event))
      .catch((error: unknown) => error);

    expect(isRedirect(result) && { status: result.status, location: result.location }).toEqual({
      status: 307,
      location,
    });
  });
});
