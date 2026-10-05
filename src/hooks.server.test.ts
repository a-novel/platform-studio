import { handle } from "./hooks.server";

import { describe, expect, it, vi } from "vitest";

import type { RequestEvent } from "@sveltejs/kit";
import type { Handle } from "@sveltejs/kit/hooks";

function event(path: string, language?: string): RequestEvent {
  const url = new URL(path, "https://studio.test");
  return {
    url,
    locals: {},
    request: new Request(url, { headers: language ? { "accept-language": language } : undefined }),
  } as RequestEvent;
}

describe("Studio request hook", () => {
  it("keeps translations and document language isolated across concurrent requests", async () => {
    const french = event("/", "fr-CA,fr;q=0.9,en;q=0.8");
    const english = event("/", "de");
    const resolve = vi.fn<Parameters<Handle>[0]["resolve"]>(async (request, options) => {
      await Promise.resolve();
      const html = await options?.transformPageChunk?.({ html: '<html lang="%lang%">', done: true });
      return new Response(html + request.locals.i18n.t("shell.accountFallback"));
    });
    const [fr, en] = await Promise.all([handle({ event: french, resolve }), handle({ event: english, resolve })]);
    await expect(fr.text()).resolves.toBe('<html lang="fr">Compte');
    await expect(en.text()).resolves.toBe('<html lang="en">Account');
    expect(french.locals.locale).toBe("fr");
    expect(english.locals.locale).toBe("en");
    expect(french.locals.i18n).not.toBe(english.locals.i18n);
  });

  it.each([200, 400, 303, 503])("protects secure-link responses with status %s", async (status) => {
    const resolved = new Response("private page", {
      status,
      headers: {
        "cache-control": "public",
        "content-type": "text/html",
        location: "/ext/account/create?result=success",
      },
    });
    const response = await handle({
      event: event("/ext/account/create?shortCode=private-code"),
      resolve: vi.fn().mockResolvedValue(resolved),
    });
    expect(response.status).toBe(status);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("referrer-policy")).toBe("strict-origin");
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    expect(response.headers.get("content-type")).toBe("text/html");
    expect(response.headers.get("location")).toBe("/ext/account/create?result=success");
    await expect(response.text()).resolves.toBe("private page");
  });

  it("preserves caching policy on ordinary pages", async () => {
    const response = await handle({
      event: event("/"),
      resolve: vi.fn().mockResolvedValue(new Response("home", { headers: { "cache-control": "private" } })),
    });
    expect(response.headers.get("cache-control")).toBe("private");
    expect(response.headers.has("x-robots-tag")).toBe(false);
  });
});
