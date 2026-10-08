import { createStudioI18n } from "#lib/i18n/instance.js";

import { accountActions, loadAccount } from "./account-route";
import { authenticationActions } from "./authentication-route";
import { logoutAuthentication } from "./logout";
import { loadStudioShell } from "./shell-layout";
import { loadShortCodeRoute, submitShortCodeRoute } from "./short-code-route";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Role } from "@a-novel/service-authentication-rest";

import type { Cookies, RequestEvent } from "@sveltejs/kit";

const env = vi.hoisted(() => ({
  AUTHENTICATION_SERVICE_URL: "https://authentication.test",
  DOWNTIME_URL: undefined,
  HEALTHCHECK_TIMEOUT_MS: undefined,
}));

vi.mock("$app/env/private", () => env);

// The planned downtime the published document announces; none unless a test sets one.
const published = vi.hoisted(() => ({ downtime: null as { components: string[]; start: Date; end: Date } | null }));

vi.mock("@a-novel-kit/nodelib-server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@a-novel-kit/nodelib-server")>()),
  createDowntimeReader: () => async () => published.downtime,
}));

const fetchService = vi.fn<typeof fetch>();
const userId = "140f24ee-1531-4a9d-ace8-20b38e1b21bc";
const credentials = {
  id: userId,
  email: "maya.chen@example.com",
  role: Role.User,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};
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
    expect(fetchService).toHaveBeenLastCalledWith("https://authentication.test/v2/waitlist", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: "Bearer anonymous-access" },
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

  it.each([
    ["storage unavailable", new Response("private service detail", { status: 503 })],
    ["unknown conflict", Response.json({ code: "private service detail" }, { status: 409 })],
    ["malformed conflict", new Response("private service detail", { status: 409 })],
    ["network failure", new Error("private service detail")],
  ])("never acknowledges a request after %s", async (_, outcome) => {
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
      session: { status: "authenticated", displayName: "Maya Chen", initials: "MC" },
      authorization: "allowed",
    });
    expect(fetchService).toHaveBeenCalledExactlyOnceWith("https://authentication.test/v2/session", {
      method: "GET",
      headers: { "Content-Type": "application/json", Authorization: "Bearer private-access" },
    });
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
    await expect(loadStudioShell(event)).resolves.toMatchObject({
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
      session: { status: "error" },
      authorization: "unavailable",
    });
    expect(fetchService).toHaveBeenLastCalledWith("https://authentication.test/v2/session", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
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
    expect(fetchService).toHaveBeenCalledExactlyOnceWith("https://authentication.test/v2/session", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
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

  it("logs out locally even while authentication is unreachable", () => {
    const { event, values, cookies } = request("/auth/logout?returnTo=https://attacker.invalid", {
      ...tokenCookies,
      studio_identity_handle: "maya.chen",
    });
    expect(() => logoutAuthentication(event)).toThrow(expect.objectContaining({ status: 303, location: "/" }));
    expect(values.size).toBe(0);
    expect(cookies.delete.mock.calls).toEqual([
      ["studio_access_token", { path: "/" }],
      ["studio_refresh_token", { path: "/" }],
      ["studio_identity_handle", { path: "/" }],
    ]);
    expect(fetchService).not.toHaveBeenCalled();
  });

  it("returns an account recap without serializing access or refresh credentials", async () => {
    const { event } = request("/account", tokenCookies);
    fetchService.mockResolvedValueOnce(Response.json(identity));
    await expect(loadAccount(event)).resolves.toEqual({
      authorization: "allowed",
      accountModel: {
        claims: {
          status: "ready",
          userId,
          roles: [Role.User],
          accessExpiresAt: "Non renseignée",
          refreshExpiresAt: "Non renseignée",
        },
        passwordState: { status: "ready" },
        emailState: { status: "ready" },
        logoutState: "ready",
      },
    });
  });

  it("changes a password only after verifying the session and omits confirmation from the API request", async () => {
    const { event } = request("/account?/password", tokenCookies, {
      currentPassword: "old-password",
      ...password,
    });
    fetchService.mockResolvedValueOnce(Response.json(identity)).mockResolvedValueOnce(Response.json(credentials));
    await expect(accountActions.password(event)).resolves.toEqual({
      accountAction: { kind: "password", state: { status: "success", feedback: "passwordChanged" } },
    });
    expect(fetchService).toHaveBeenCalledTimes(2);
    expect(fetchService).toHaveBeenLastCalledWith("https://authentication.test/v2/credentials/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: "Bearer private-access" },
      body: expect.any(String),
    });
    expect(JSON.parse(fetchService.mock.lastCall?.[1]?.body as string)).toEqual({
      currentPassword: "old-password",
      password: password.password,
    });
  });

  it.each(["password", "email"] as const)("redirects anonymous %s changes before any mutation", async (action) => {
    const { event } = request(
      "/account",
      {},
      {
        currentPassword: "old-password",
        ...password,
        email: "new@example.com",
      }
    );
    await expect(accountActions[action](event)).rejects.toMatchObject({
      status: 303,
      location: "/?auth=login&returnTo=%2Faccount",
    });
    expect(fetchService).not.toHaveBeenCalled();
  });
});

const email = Buffer.from("maya.chen@example.com").toString("base64url");
const registrationLink = `/ext/account/create?shortCode=private-code&target=${email}`;
const password = { password: "replacement-password", confirmPassword: "replacement-password" };

const journeys = [
  {
    journey: "register",
    path: registrationLink,
    endpoint: "/v2/credentials",
    body: { email: "maya.chen@example.com", password: password.password, shortCode: "private-code" },
    response: { accessToken: "registered-access", refreshToken: "registered-refresh" },
    continueHref: "/",
    restartHref: "/?auth=register",
  },
  {
    journey: "password-reset",
    path: `/ext/password/reset?shortCode=private-code&target=${userId}`,
    endpoint: "/v2/credentials/password",
    body: { password: password.password, shortCode: "private-code", userID: userId },
    response: credentials,
    continueHref: "/?auth=login",
    restartHref: "/?auth=reset",
  },
  {
    journey: "email-update",
    path: `/ext/email/validate?shortCode=private-code&target=${userId}&source=${email}`,
    endpoint: "/v2/credentials/email",
    body: { shortCode: "private-code", userID: userId },
    response: credentials,
    continueHref: "/account",
    restartHref: "/account",
  },
] as const;

describe("secure-link request boundary", () => {
  it.each(journeys)("loads $journey without returning link secrets or consuming it", async (scenario) => {
    const { event } = request(scenario.path);
    await expect(loadShortCodeRoute(scenario.journey, event)).resolves.toEqual({
      links: { continueHref: scenario.continueHref, restartHref: scenario.restartHref },
      model: { journey: scenario.journey, state: { status: "ready" } },
    });
    expect(fetchService).not.toHaveBeenCalled();
  });

  it.each(journeys)("completes $journey and redirects to a URL without credentials", async (scenario) => {
    const { event, values } = request(scenario.path, {}, scenario.journey === "email-update" ? {} : password);
    fetchService
      .mockResolvedValueOnce(Response.json({ accessToken: "anonymous-access", refreshToken: "" }))
      .mockResolvedValueOnce(Response.json(scenario.response));
    await expect(submitShortCodeRoute(scenario.journey, event)).rejects.toMatchObject({
      status: 303,
      location: event.url.pathname + "?result=success",
    });
    expect(fetchService).toHaveBeenCalledTimes(2);
    expect(fetchService).toHaveBeenLastCalledWith("https://authentication.test" + scenario.endpoint, {
      method: scenario.journey === "email-update" ? "PATCH" : "PUT",
      headers: { "Content-Type": "application/json", Authorization: "Bearer anonymous-access" },
      body: expect.any(String),
    });
    expect(JSON.parse(fetchService.mock.lastCall?.[1]?.body as string)).toEqual(scenario.body);
    expect(Object.fromEntries(values)).toEqual(
      scenario.journey === "register"
        ? {
            studio_access_token: "registered-access",
            studio_refresh_token: "registered-refresh",
            studio_identity_handle: "maya.chen",
          }
        : scenario.journey === "email-update"
          ? { studio_access_token: "anonymous-access", studio_identity_handle: "maya.chen" }
          : { studio_access_token: "anonymous-access" }
    );
  });

  it("returns safe field errors without creating a session or consuming the link", async () => {
    const { event } = request(registrationLink, {}, { password: "private-password", confirmPassword: "mismatch" });
    await expect(submitShortCodeRoute("register", event)).resolves.toMatchObject({
      status: 400,
      data: {
        shortCode: {
          journey: "register",
          state: { status: "validation-error", issues: [{ field: "confirmPassword", feedback: "passwordMismatch" }] },
        },
      },
    });
    expect(fetchService).not.toHaveBeenCalled();
  });

  it.each(["/ext/account/create", registrationLink + "&shortCode=duplicate"])(
    "redirects malformed link %s without contacting authentication",
    async (path) => {
      const { event } = request(path, {}, password);
      await expect(submitShortCodeRoute("register", event)).rejects.toMatchObject({
        status: 303,
        location: "/ext/account/create?result=invalid",
      });
      expect(fetchService).not.toHaveBeenCalled();
    }
  );

  it.each([403, 404, 409])("removes rejected link credentials after HTTP %s", async (status) => {
    const { event, values } = request(registrationLink, {}, password);
    fetchService
      .mockResolvedValueOnce(Response.json({ accessToken: "anonymous-access", refreshToken: "" }))
      .mockResolvedValueOnce(new Response("private rejection detail", { status }));
    await expect(submitShortCodeRoute("register", event)).rejects.toMatchObject({
      status: 303,
      location: "/ext/account/create?result=invalid",
    });
    expect(values.has("studio_identity_handle")).toBe(false);
    expect(values.has("studio_refresh_token")).toBe(false);
  });

  it("returns a retryable outage without echoing secrets or claiming completion", async () => {
    const { event } = request(registrationLink, {}, password);
    fetchService
      .mockResolvedValueOnce(Response.json({ accessToken: "anonymous-access", refreshToken: "" }))
      .mockResolvedValueOnce(new Response("private service detail", { status: 503 }));
    await expect(submitShortCodeRoute("register", event)).resolves.toEqual({
      status: 503,
      data: { shortCode: { journey: "register", state: { status: "service-error", feedback: "serviceUnavailable" } } },
    });
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
      session: { status: "downtime" },
      authorization: "unavailable",
    });
    expect(fetchService).not.toHaveBeenCalled();
  });

  it("refuses sign-in, account and secure links without calling authentication", async () => {
    published.downtime = started();

    await expect(
      authenticationActions.default(request("/?auth=login", {}, { email: "a@b.test", password: "p" }).event)
    ).rejects.toMatchObject(downtimeRefusal);
    await expect(loadAccount(request("/account", { studio_access_token: "access" }).event)).rejects.toMatchObject(
      downtimeRefusal
    );
    await expect(loadShortCodeRoute("register", request(registrationLink).event)).rejects.toMatchObject(
      downtimeRefusal
    );
    await expect(submitShortCodeRoute("register", request(registrationLink, {}, password).event)).rejects.toMatchObject(
      downtimeRefusal
    );
    expect(fetchService).not.toHaveBeenCalled();
  });

  it("locks nothing before the start, or for a service Studio doesn't use", async () => {
    for (const downtime of [
      { ...started(), start: new Date(Date.now() + 60_000) },
      { ...started(), components: ["service-genai.database"] },
    ]) {
      published.downtime = downtime;

      await expect(loadShortCodeRoute("register", request(registrationLink).event)).resolves.toMatchObject({
        model: { journey: "register" },
      });
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
    await expect(loadAccount(request("/account", { studio_access_token: "access" }).event)).rejects.toMatchObject(
      downtimeRefusal
    );
  });
});
