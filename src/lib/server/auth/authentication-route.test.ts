import { authenticationActions } from "./authentication-route";
import { createAuthenticationContext } from "./context";
import { AuthenticationSession } from "./session";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { HttpError } from "@a-novel-kit/nodelib-browser/http";
import {
  AuthenticationApi,
  Lang,
  shortCodeCreatePasswordReset,
  shortCodeCreateRegister,
} from "@a-novel/service-authentication-rest";

import type { RequestEvent } from "@sveltejs/kit";

vi.mock("./context", () => ({ createAuthenticationContext: vi.fn() }));
vi.mock("@a-novel/service-authentication-rest", { spy: true });

function event(journey: string, fields = { email: "creator@example.test", password: "test-password" }): RequestEvent {
  const url = new URL(`https://studio.test/?auth=${journey}`);
  const request = {
    url,
    locals: { locale: "fr" },
    cookies: { get: vi.fn(), set: vi.fn(), delete: vi.fn() },
    request: new Request(url, { method: "POST", body: new URLSearchParams(fields) }),
  } as unknown as RequestEvent;
  vi.mocked(createAuthenticationContext).mockReturnValue({
    api: new AuthenticationApi("https://auth.example.test"),
    session: new AuthenticationSession(
      { claims: vi.fn(), login: vi.fn(), refresh: vi.fn(), createAnonymous: vi.fn() },
      request.cookies,
      url
    ),
  });
  return request;
}

describe("authentication outcomes", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each(["login", "register", "reset"])(
    "rejects invalid %s fields before contacting the service",
    async (journey) => {
      const request = event(journey, { email: "invalid-private-value", password: "" });
      const result = await authenticationActions.default(request);
      expect(result).toMatchObject({
        status: 400,
        data: { authentication: { journey, state: { status: "validation-error" } } },
      });
      expect(createAuthenticationContext).not.toHaveBeenCalled();
      expect(JSON.stringify(result)).not.toContain("invalid-private-value");
    }
  );

  it.each([
    [new HttpError(401, "fixture-only detail"), 401, "invalidCredentials"],
    [new Error("fixture-only detail"), 503, "serviceUnavailable"],
  ] as const)("maps login rejection to %s without exposing service detail", async (error, status, feedback) => {
    vi.spyOn(AuthenticationSession.prototype, "login").mockRejectedValue(error);
    const result = await authenticationActions.default(event("login"));
    expect(result).toMatchObject({
      status,
      data: { authentication: { journey: "login", state: { status: "service-error", feedback } } },
    });
    expect(JSON.stringify(result)).not.toContain("fixture-only detail");
  });

  it.each([
    ["register", shortCodeCreateRegister],
    ["reset", shortCodeCreatePasswordReset],
  ] as const)("acknowledges %s delivery and handles unavailability", async (journey, send) => {
    vi.spyOn(AuthenticationSession.prototype, "anonymousAccessToken").mockResolvedValue("fixture-access");
    vi.mocked(send).mockResolvedValueOnce(undefined);
    await expect(authenticationActions.default(event(journey))).resolves.toEqual({
      authentication: { journey, state: { status: "pending-email", targetHint: "creator@example.test" } },
    });
    expect(send).toHaveBeenCalledWith(expect.any(AuthenticationApi), "fixture-access", {
      email: "creator@example.test",
      lang: Lang.Fr,
    });
    vi.mocked(send).mockRejectedValueOnce(new Error("private service detail"));
    await expect(authenticationActions.default(event(journey))).resolves.toMatchObject({
      status: 503,
      data: { authentication: { journey, state: { status: "service-error", feedback: "serviceUnavailable" } } },
    });
  });
});

describe("login return destination", () => {
  it.each([
    ["/account?panel=email#email", "/account?panel=email#email"],
    ["https://attacker.invalid", "/"],
    ["/?auth=login&returnTo=%2Faccount", "/"],
  ])("redirects to a sanitized %s only after successful login", async (returnTo, expected) => {
    const login = vi.spyOn(AuthenticationSession.prototype, "login").mockResolvedValue(undefined);
    const url = new URL("https://studio.test/?auth=login");
    url.searchParams.set("returnTo", returnTo);
    const event = {
      url,
      cookies: { get: vi.fn(), set: vi.fn(), delete: vi.fn() },
      request: new Request(url, {
        method: "POST",
        body: new URLSearchParams({
          email: "creator@example.com",
          password: "test-password",
        }),
      }),
    } as unknown as RequestEvent;
    vi.mocked(createAuthenticationContext).mockReturnValue({
      api: new AuthenticationApi("https://auth.example.test"),
      session: new AuthenticationSession(
        { claims: vi.fn(), login: vi.fn(), refresh: vi.fn(), createAnonymous: vi.fn() },
        event.cookies,
        url
      ),
    });
    await expect(authenticationActions.default(event)).rejects.toMatchObject({ status: 303, location: expected });
    expect(login).toHaveBeenCalledWith("creator@example.com", "test-password");
  });
});
