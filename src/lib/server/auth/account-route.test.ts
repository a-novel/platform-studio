import { createStudioI18n } from "$lib/i18n/instance";

import { accountActions, loadAccount } from "./account-route";
import { createAuthenticationContext } from "./context";
import { AuthenticationSession, AuthenticationUnavailableError } from "./session";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { HttpError } from "@a-novel-kit/nodelib-browser/http";
import {
  AuthenticationApi,
  credentialsUpdatePassword,
  shortCodeCreateEmailUpdate,
} from "@a-novel/service-authentication-rest";

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
      authorization: "unavailable",
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

  it("keeps a rejected current password in the form instead of showing the generic access-denied page", async () => {
    authenticated.mockResolvedValue({
      status: "available",
      accessToken: "fixture-access",
      claims: { userID: "test-user", refreshTokenID: "test-refresh", roles: [] },
    });
    vi.mocked(credentialsUpdatePassword).mockRejectedValue(new HttpError(403, "incorrect current password"));
    await expect(accountActions.password(event())).resolves.toMatchObject({
      status: 403,
      data: { accountAction: { kind: "password", state: { feedback: "invalidCurrentPassword" } } },
    });
  });

  it("leaves an email change pending after sending its confirmation link", async () => {
    authenticated.mockResolvedValue({
      status: "available",
      accessToken: "fixture-access",
      claims: { userID: "test-user", refreshTokenID: "test-refresh", roles: [] },
    });
    vi.mocked(shortCodeCreateEmailUpdate).mockResolvedValue(undefined);
    const request = event();
    request.request = new Request("https://studio.test/account?/email", {
      method: "POST",
      body: new URLSearchParams({ email: "new@example.test" }),
    });

    await expect(accountActions.email(request)).resolves.toEqual({
      accountAction: {
        kind: "email",
        state: { status: "pending-email", targetHint: "new@example.test" },
      },
    });
    expect(shortCodeCreateEmailUpdate).toHaveBeenCalledOnce();
  });

  it("rejects invalid email before calling the service and names the account control", async () => {
    const request = event();
    request.request = new Request("https://studio.test/account?/email", {
      method: "POST",
      body: new URLSearchParams({ email: "invalid-private-value" }),
    });
    const result = await accountActions.email(request);
    expect(result).toMatchObject({
      status: 400,
      data: {
        accountAction: {
          kind: "email",
          state: {
            status: "validation-error",
            issues: [{ field: "newEmail", feedback: "email" }],
          },
        },
      },
    });
    expect(JSON.stringify(result)).not.toContain("invalid-private-value");
    expect(shortCodeCreateEmailUpdate).not.toHaveBeenCalled();
  });
});
