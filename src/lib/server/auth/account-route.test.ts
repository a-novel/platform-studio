import { createStudioI18n } from "$lib/i18n/instance";

import { accountActions, loadAccount } from "./account-route";
import { createAuthenticationContext } from "./context";
import { AuthenticationSession, AuthenticationUnavailableError } from "./session";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthenticationApi, credentialsUpdatePassword } from "@a-novel/service-authentication-rest";

import type { RequestEvent } from "@sveltejs/kit";

vi.mock("./context", () => ({ createAuthenticationContext: vi.fn() }));
vi.mock("@a-novel/service-authentication-rest", { spy: true });

const authenticated = vi.spyOn(AuthenticationSession.prototype, "authenticated");

function event(): RequestEvent {
  return {
    url: new URL("https://studio.test/account"),
    locals: { locale: "en", i18n: createStudioI18n("en") },
    cookies: { get: vi.fn(), set: vi.fn(), delete: vi.fn() },
    request: new Request("https://studio.test/account?/password", {
      method: "POST",
      body: new URLSearchParams({
        currentPassword: "old-password",
        password: "new-password",
        confirmPassword: "new-password",
      }),
    }),
  } as unknown as RequestEvent;
}

describe("account route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const request = event();
    vi.mocked(createAuthenticationContext).mockReturnValue({
      api: new AuthenticationApi("https://auth.example.test"),
      session: new AuthenticationSession(
        { claims: vi.fn(), login: vi.fn(), refresh: vi.fn(), createAnonymous: vi.fn() },
        request.cookies,
        request.url
      ),
    });
  });

  it("limits a retrieval failure to the recap and initializes usable actions", async () => {
    authenticated.mockRejectedValue(new AuthenticationUnavailableError());
    await expect(loadAccount(event())).resolves.toEqual({
      accountModel: {
        claims: { status: "error", feedback: "sessionUnavailable" },
        passwordState: { status: "ready" },
        emailState: { status: "ready" },
        logoutState: "ready",
      },
    });
  });

  it("redirects a definitively anonymous request to login", async () => {
    authenticated.mockResolvedValue(null);
    await expect(loadAccount(event())).rejects.toMatchObject({
      status: 303,
      location: "/?auth=login&returnTo=%2Faccount",
    });
  });

  it("rechecks authentication before a form can change a password", async () => {
    authenticated.mockRejectedValue(new AuthenticationUnavailableError());
    const result = await accountActions.password(event());
    expect(authenticated).toHaveBeenCalledOnce();
    expect(result).toMatchObject({
      status: 503,
      data: { accountAction: { kind: "password", state: { status: "service-error", feedback: "serviceUnavailable" } } },
    });
    expect(credentialsUpdatePassword).not.toHaveBeenCalled();
  });
});
