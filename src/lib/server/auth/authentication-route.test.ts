import { authenticationActions } from "./authentication-route";
import { createAuthenticationContext } from "./context";
import { AuthenticationSession } from "./session";

import { describe, expect, it, vi } from "vitest";

import { AuthenticationApi } from "@a-novel/service-authentication-rest";

import type { RequestEvent } from "@sveltejs/kit";

vi.mock("./context", () => ({ createAuthenticationContext: vi.fn() }));

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
