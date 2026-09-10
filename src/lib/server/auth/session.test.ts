import {
  AuthenticationSession,
  AuthenticationUnavailableError,
  type SessionClient,
  type SessionCookies,
  readTokenExpiry,
} from "./session";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { HttpError } from "@a-novel-kit/nodelib-browser/http";
import { Role } from "@a-novel/service-authentication-rest";

type CookieSetOptions = Parameters<SessionCookies["set"]>[2];

class MemoryCookies implements SessionCookies {
  readonly values = new Map<string, string>();
  readonly writes: Array<{ name: string; options: CookieSetOptions; value: string }> = [];
  readonly deletions: string[] = [];

  get(name: string): string | undefined {
    return this.values.get(name);
  }

  set(name: string, value: string, options: CookieSetOptions): void {
    this.values.set(name, value);
    this.writes.push({ name, options, value });
  }

  delete(name: string): void {
    this.values.delete(name);
    this.deletions.push(name);
  }
}

function createClient(): {
  [Key in keyof SessionClient]: ReturnType<typeof vi.fn<SessionClient[Key]>>;
} {
  return {
    claims: vi.fn<SessionClient["claims"]>(),
    createAnonymous: vi.fn<SessionClient["createAnonymous"]>(),
    login: vi.fn<SessionClient["login"]>(),
    refresh: vi.fn<SessionClient["refresh"]>(),
  };
}

function createJwt(expiry: number): string {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ exp: expiry })).toString("base64url");
  return `${header}.${payload}.signature`;
}

describe("AuthenticationSession", () => {
  let client: ReturnType<typeof createClient>;
  let cookies: MemoryCookies;

  beforeEach(() => {
    client = createClient();
    cookies = new MemoryCookies();
  });

  it("does not create an anonymous session during an ordinary request", async () => {
    const session = new AuthenticationSession(client, cookies, new URL("http://studio.test/"));

    await expect(session.current()).resolves.toEqual({ status: "none" });
    expect(client.createAnonymous).not.toHaveBeenCalled();
  });

  it("returns verified authenticated claims without exposing cookies to the browser", async () => {
    cookies.values.set("studio_access_token", "access");
    cookies.values.set("studio_refresh_token", "refresh");
    cookies.values.set("studio_identity_handle", "maya.chen");
    client.claims.mockResolvedValue({
      userID: "140f24ee-1531-4a9d-ace8-20b38e1b21bc",
      roles: [Role.User],
      refreshTokenID: "refresh-id",
    });
    const session = new AuthenticationSession(client, cookies, new URL("https://studio.test/"));

    await expect(session.authenticated()).resolves.toMatchObject({
      status: "available",
      accessToken: "access",
      refreshToken: "refresh",
      identityHandle: "maya.chen",
      claims: { roles: [Role.User] },
    });
  });

  it("stores only the email handle in an HTTP-only identity cookie", async () => {
    client.login.mockResolvedValue({ accessToken: "access", refreshToken: "refresh" });
    const session = new AuthenticationSession(client, cookies, new URL("https://studio.test/"));

    await session.login("maya.chen@example.com", "valid-password");

    expect(cookies.values.get("studio_identity_handle")).toBe("maya.chen");
    expect(cookies.writes.at(-1)?.options).toMatchObject({
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: true,
    });
  });

  it("does not treat anonymous claims as an authenticated identity", async () => {
    cookies.values.set("studio_access_token", "anonymous-access");
    client.claims.mockResolvedValue({ roles: [] });
    const session = new AuthenticationSession(client, cookies, new URL("https://studio.test/"));

    await expect(session.authenticated()).resolves.toBeNull();
    expect(cookies.values.get("studio_access_token")).toBe("anonymous-access");
  });

  it("refreshes a rejected access token and stores the replacement", async () => {
    cookies.values.set("studio_access_token", "expired-access");
    cookies.values.set("studio_refresh_token", "refresh");
    client.claims.mockRejectedValueOnce(new HttpError(403, "expired")).mockResolvedValueOnce({
      userID: "140f24ee-1531-4a9d-ace8-20b38e1b21bc",
      roles: [Role.User],
    });
    client.refresh.mockResolvedValue({
      accessToken: "fresh-access",
      refreshToken: "refresh",
    });
    const session = new AuthenticationSession(client, cookies, new URL("https://studio.test/"));

    await expect(session.current()).resolves.toMatchObject({
      status: "available",
      accessToken: "fresh-access",
    });
    expect(cookies.values.get("studio_access_token")).toBe("fresh-access");
    expect(client.refresh).toHaveBeenCalledWith({
      accessToken: "expired-access",
      refreshToken: "refresh",
    });
  });

  it("clears a token pair rejected during refresh", async () => {
    cookies.values.set("studio_access_token", "expired-access");
    cookies.values.set("studio_refresh_token", "expired-refresh");
    cookies.values.set("studio_identity_handle", "maya.chen");
    client.claims.mockRejectedValue(new HttpError(403, "expired"));
    client.refresh.mockRejectedValue(new HttpError(403, "expired"));
    const session = new AuthenticationSession(client, cookies, new URL("https://studio.test/"));

    await expect(session.current()).resolves.toEqual({ status: "none" });
    expect(cookies.values.size).toBe(0);
  });

  it("creates an anonymous token only when a protected anonymous operation needs it", async () => {
    client.createAnonymous.mockResolvedValue({
      accessToken: "anonymous-access",
      refreshToken: "",
    });
    const session = new AuthenticationSession(client, cookies, new URL("http://studio.test/"));

    await expect(session.anonymousAccessToken()).resolves.toBe("anonymous-access");
    expect(cookies.values.get("studio_access_token")).toBe("anonymous-access");
    expect(cookies.values.has("studio_refresh_token")).toBe(false);
  });

  it("does not turn an authentication outage into an anonymous session", async () => {
    cookies.values.set("studio_access_token", "access");
    client.claims.mockRejectedValue(new Error("network unavailable"));
    const session = new AuthenticationSession(client, cookies, new URL("https://studio.test/"));

    await expect(session.authenticated()).rejects.toBeInstanceOf(AuthenticationUnavailableError);
    expect(cookies.values.get("studio_access_token")).toBe("access");
  });

  it("uses secure HTTP-only SameSite cookies on HTTPS", () => {
    const session = new AuthenticationSession(client, cookies, new URL("https://studio.test/"));

    session.accept({ accessToken: "access", refreshToken: "refresh" });

    expect(cookies.writes).toHaveLength(2);
    expect(cookies.writes[0]?.options).toMatchObject({
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: true,
    });
  });
});

describe("readTokenExpiry", () => {
  it("reads a JWT expiry for display", () => {
    expect(readTokenExpiry(createJwt(1_800_000_000))?.toISOString()).toBe("2027-01-15T08:00:00.000Z");
  });

  it.each(["not-a-jwt", "a.invalid-json.c", createJwt(-1)])("rejects malformed or invalid expiry data", (token) => {
    expect(readTokenExpiry(token)).toBeNull();
  });
});
