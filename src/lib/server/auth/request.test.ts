import { createStudioI18n } from "#lib/i18n/instance.js";

import { authenticationActions } from "./authentication-route";
import { logoutAuthentication } from "./logout";
import { loadStudioShell } from "./shell-layout";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Role } from "@a-novel/service-authentication-rest";

import type { Cookies, RequestEvent } from "@sveltejs/kit";

const env = vi.hoisted(() => ({
  ACCOUNT_URL: "https://account.test",
  AUTHENTICATION_SERVICE_AUDIENCE: undefined,
  AUTHENTICATION_SERVICE_URL: "https://authentication.test",
  DOWNTIME_URL: undefined,
  HEALTHCHECK_TIMEOUT_MS: undefined,
  SERVICE_TOKEN_PATH: undefined,
}));

vi.mock("$app/env/private", () => env);

// The planned downtime the published document announces. A test sets one when it needs it.
const published = vi.hoisted(() => ({ downtime: null as { components: string[]; start: Date; end: Date } | null }));

vi.mock("@a-novel-kit/nodelib-server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@a-novel-kit/nodelib-server")>()),
  createDowntimeReader: () => async () => published.downtime,
}));

const fetchService = vi.fn<typeof fetch>();

/** The last authentication call as the service receives it, after Studio's fetch wrapper. */
function sentRequest() {
  const [url, init] = fetchService.mock.lastCall ?? [];
  return { url, method: init?.method, headers: Object.fromEntries(new Headers(init?.headers)), body: init?.body };
}

const userId = "140f24ee-1531-4a9d-ace8-20b38e1b21bc";
const identity = { userID: userId, roles: [Role.User] };
const tokenCookies = { studio_access_token: "private-access", studio_refresh_token: "private-refresh" };

function request(path: string, cookieValues: Record<string, string> = {}, fields?: Record<string, string>) {
  const values = new Map(Object.entries(cookieValues));
  const cookies = {
    get: vi.fn((name: string) => values.get(name)),
    set: vi.fn<Cookies["set"]>((name, value) => {
      values.set(name, value);
    }),
    delete: vi.fn<Cookies["delete"]>((name) => {
      values.delete(name);
    }),
  };
  const url = new URL(path, "https://studio.test");
  const event = {
    cookies,
    getClientAddress: () => "192.0.2.1",
    url,
    locals: { locale: "fr", i18n: createStudioI18n("fr") },
    request: new Request(url, fields ? { method: "POST", body: new URLSearchParams(fields) } : undefined),
  } as unknown as RequestEvent;
  return { event, cookies, values };
}

beforeEach(() => {
  env.AUTHENTICATION_SERVICE_URL = "https://authentication.test";
  fetchService.mockReset().mockRejectedValue(new Error("Unexpected authentication request"));
  vi.stubGlobal("fetch", fetchService);
});

afterEach(() => {
  vi.unstubAllGlobals();
  published.downtime = null;
});

describe("invitation requests at the request boundary", () => {
  const email = "Creator@Example.test";

  it.each(["en", "fr"] as const)("records a request using the published client and %s locale", async (locale) => {
    const { event, cookies } = request("/?auth=register", {}, { email });
    event.locals.locale = locale;
    fetchService
      .mockResolvedValueOnce(Response.json({ accessToken: "anonymous-access", refreshToken: "anonymous-refresh" }))
      .mockResolvedValueOnce(new Response(null, { status: 202 }));
    await expect(authenticationActions.default(event)).resolves.toEqual({
      authentication: { journey: "register", state: { status: "recorded", email } },
    });
    expect(fetchService).toHaveBeenCalledTimes(2);
    expect(sentRequest()).toEqual({
      url: "https://authentication.test/v2/waitlist",
      method: "PUT",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer anonymous-access",
        "x-client-ip": "192.0.2.1",
      },
      body: JSON.stringify({ email, lang: locale }),
    });
    expect(cookies.set).toHaveBeenCalledWith("studio_access_token", "anonymous-access", {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: true,
    });
  });

  it.each(["account_exists", "already_waitlisted"])("returns the validated %s warning", async (code) => {
    const { event } = request("/?auth=register", {}, { email });
    fetchService
      .mockResolvedValueOnce(Response.json({ accessToken: "anonymous-access", refreshToken: "anonymous-refresh" }))
      .mockResolvedValueOnce(Response.json({ code, detail: "private service detail" }, { status: 409 }));
    await expect(authenticationActions.default(event)).resolves.toEqual({
      status: 409,
      data: { authentication: { journey: "register", state: { status: "conflict", code } } },
    });
  });

  const unacknowledged = [
    ["storage unavailable", new Response("private service detail", { status: 503 })],
    ["unknown conflict", Response.json({ code: "private service detail" }, { status: 409 })],
    ["malformed conflict", new Response("private service detail", { status: 409 })],
    ["network failure", new Error("private service detail")],
  ] as const;

  it.each(unacknowledged)("never acknowledges a request after %s", async (_, outcome) => {
    const { event } = request("/?auth=register", {}, { email });
    fetchService.mockResolvedValueOnce(
      Response.json({ accessToken: "anonymous-access", refreshToken: "anonymous-refresh" })
    );
    if (outcome instanceof Error) fetchService.mockRejectedValueOnce(outcome);
    else fetchService.mockResolvedValueOnce(outcome as Response);
    await expect(authenticationActions.default(event)).resolves.toEqual({
      status: 503,
      data: {
        authentication: { journey: "register", state: { status: "service-error", feedback: "serviceUnavailable" } },
      },
    });
    expect(fetchService).toHaveBeenCalledTimes(2);
  });

  it("does not contact the waitlist when the anonymous session fails", async () => {
    const { event } = request("/?auth=register", {}, { email });
    fetchService.mockResolvedValueOnce(new Response(null, { status: 503 }));
    await expect(authenticationActions.default(event)).resolves.toMatchObject({ status: 503 });
    expect(fetchService).toHaveBeenCalledTimes(1);
  });
});

describe("Studio session at the request boundary", () => {
  it("serves an anonymous home without calling authentication", async () => {
    const { event } = request("/");
    await expect(loadStudioShell(event)).resolves.toEqual({
      activeNavigation: "home",
      accountHref: "https://account.test/account",
      session: { status: "anonymous" },
      authorization: "anonymous",
    });
    expect(fetchService).not.toHaveBeenCalled();
  });

  it("exposes only a verified display identity to the browser", async () => {
    const { event } = request("/account", { ...tokenCookies, studio_identity_handle: "maya.chen" });
    fetchService.mockResolvedValueOnce(Response.json(identity));
    await expect(loadStudioShell(event)).resolves.toEqual({
      activeNavigation: null,
      accountHref: "https://account.test/account",
      session: { status: "authenticated", displayName: "Maya Chen", initials: "MC" },
      authorization: "allowed",
    });
    expect(fetchService).toHaveBeenCalledOnce();
    expect(sentRequest()).toEqual({
      url: "https://authentication.test/v2/session",
      method: "GET",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer private-access",
        "x-client-ip": "192.0.2.1",
      },
    });
  });

  it("checks the session once for the loads of one request", async () => {
    const { event } = request("/", tokenCookies);
    fetchService.mockImplementation(async () => Response.json(identity));

    await Promise.all([loadStudioShell(event), loadStudioShell(event)]);

    expect(fetchService.mock.calls.map(([url]) => url)).toEqual(["https://authentication.test/v2/session"]);
  });

  it("uses a localized account label when the identity cookie contains a full email", async () => {
    const { event } = request("/", { ...tokenCookies, studio_identity_handle: "maya.chen@example.com" });
    fetchService.mockResolvedValueOnce(Response.json(identity));
    await expect(loadStudioShell(event)).resolves.toMatchObject({
      session: { status: "authenticated", displayName: "Compte", initials: "A" },
    });
  });

  it("keeps anonymous service claims out of authenticated UI", async () => {
    const { event } = request("/", tokenCookies);
    fetchService.mockResolvedValueOnce(Response.json({ roles: [Role.Anon] }));
    await expect(loadStudioShell(event)).resolves.toMatchObject({
      session: { status: "anonymous" },
      authorization: "anonymous",
    });
  });

  it("renders an unavailable session when runtime configuration is missing", async () => {
    env.AUTHENTICATION_SERVICE_URL = "";
    const { event } = request("/", tokenCookies);
    await expect(loadStudioShell(event)).resolves.toEqual({
      activeNavigation: "home",
      accountHref: null,
      session: { status: "error" },
      authorization: "unavailable",
    });
    expect(fetchService).not.toHaveBeenCalled();
  });

  it("preserves a recoverable session when refresh fails during an outage", async () => {
    const { event, values, cookies } = request("/", tokenCookies);
    fetchService
      .mockResolvedValueOnce(new Response("expired", { status: 401 }))
      .mockResolvedValueOnce(new Response("private service detail", { status: 503 }));
    await expect(loadStudioShell(event)).resolves.toEqual({
      activeNavigation: "home",
      accountHref: "https://account.test/account",
      session: { status: "error" },
      authorization: "unavailable",
    });
    expect(sentRequest()).toEqual({
      url: "https://authentication.test/v2/session",
      method: "PATCH",
      headers: { "content-type": "application/json", "x-client-ip": "192.0.2.1" },
      body: expect.any(String),
    });
    expect(JSON.parse(fetchService.mock.lastCall?.[1]?.body as string)).toEqual({
      accessToken: "private-access",
      refreshToken: "private-refresh",
    });
    expect(Object.fromEntries(values)).toEqual(tokenCookies);
    expect(cookies.set).not.toHaveBeenCalled();
    expect(cookies.delete).not.toHaveBeenCalled();
  });

  it("logs in through the service and stores credentials only in secure cookies", async () => {
    const { event, cookies, values } = request(
      "/?auth=login&returnTo=%2Faccount",
      {},
      {
        email: "maya.chen@example.com",
        password: "private-password",
      }
    );
    fetchService.mockResolvedValueOnce(Response.json({ accessToken: "new-access", refreshToken: "new-refresh" }));
    await expect(authenticationActions.default(event)).rejects.toMatchObject({ status: 303, location: "/account" });
    expect(fetchService).toHaveBeenCalledOnce();
    expect(sentRequest()).toEqual({
      url: "https://authentication.test/v2/session",
      method: "PUT",
      headers: { "content-type": "application/json", "x-client-ip": "192.0.2.1" },
      body: expect.any(String),
    });
    expect(JSON.parse(fetchService.mock.lastCall?.[1]?.body as string)).toEqual({
      email: "maya.chen@example.com",
      password: "private-password",
    });
    expect(Object.fromEntries(values)).toEqual({
      studio_access_token: "new-access",
      studio_refresh_token: "new-refresh",
      studio_identity_handle: "maya.chen",
    });
    for (const [, , options] of cookies.set.mock.calls) {
      expect(options).toEqual({ httpOnly: true, path: "/", sameSite: "lax", secure: true });
    }
  });

  it("revokes the refresh token at the service on logout", async () => {
    const { event, values } = request("/auth/logout", tokenCookies);
    fetchService
      .mockResolvedValueOnce(Response.json(identity))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(logoutAuthentication(event)).rejects.toMatchObject({ status: 303, location: "/" });
    expect(sentRequest()).toEqual({
      url: "https://authentication.test/v2/session/revoke",
      method: "PUT",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer private-access",
        "x-client-ip": "192.0.2.1",
      },
      body: JSON.stringify({ refreshToken: "private-refresh" }),
    });
    expect(values.size).toBe(0);
  });

  it("logs out locally even while authentication is unreachable", async () => {
    const { event, values, cookies } = request("/auth/logout?returnTo=https://attacker.invalid", {
      ...tokenCookies,
      studio_identity_handle: "maya.chen",
    });
    await expect(logoutAuthentication(event)).rejects.toMatchObject({ status: 303, location: "/" });
    expect(values.size).toBe(0);
    expect(cookies.delete.mock.calls).toEqual([
      ["studio_access_token", { path: "/" }],
      ["studio_refresh_token", { path: "/" }],
      ["studio_identity_handle", { path: "/" }],
    ]);
    // The unreachable session check leaves nothing to revoke.
    expect(fetchService).toHaveBeenCalledOnce();
  });
});

describe("planned downtime at the request boundary", () => {
  const started = () => ({
    components: ["service-json-keys.database"],
    start: new Date(Date.now() - 60_000),
    end: new Date(Date.now() + 3_600_000),
  });
  const downtimeRefusal = { status: 503, body: { message: "Planned downtime", downtime: true } };

  it("shows a maintenance session without calling authentication once a downtime has started", async () => {
    published.downtime = started();
    const { event } = request("/", { studio_access_token: "access", studio_refresh_token: "refresh" });

    await expect(loadStudioShell(event)).resolves.toEqual({
      activeNavigation: "home",
      accountHref: "https://account.test/account",
      session: { status: "downtime" },
      authorization: "unavailable",
    });
    expect(fetchService).not.toHaveBeenCalled();
  });

  it("refuses sign-in without calling authentication", async () => {
    published.downtime = started();

    await expect(
      authenticationActions.default(request("/?auth=login", {}, { email: "a@b.test", password: "p" }).event)
    ).rejects.toMatchObject(downtimeRefusal);
    expect(fetchService).not.toHaveBeenCalled();
  });

  it("locks nothing before the start, or for a service Studio doesn't use", async () => {
    const harmless = [
      { ...started(), start: new Date(Date.now() + 60_000) },
      { ...started(), components: ["service-genai.database"] },
    ];
    for (const downtime of harmless) {
      published.downtime = downtime;

      await expect(loadStudioShell(request("/").event)).resolves.toMatchObject({ session: { status: "anonymous" } });
    }
  });

  it("treats a downtime refusal from authentication as maintenance before the document announces it", async () => {
    // A fresh response per call, since a body can only be read once.
    fetchService.mockImplementation(async () =>
      Response.json(
        { type: "about:blank", title: "Service Unavailable", status: 503, tags: { downtime: true } },
        { status: 503, headers: { "Content-Type": "application/problem+json" } }
      )
    );

    await expect(
      loadStudioShell(request("/", { studio_access_token: "access", studio_refresh_token: "refresh" }).event)
    ).resolves.toMatchObject({ session: { status: "downtime" }, authorization: "unavailable" });
  });
});
