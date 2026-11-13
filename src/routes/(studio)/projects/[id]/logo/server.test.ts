import { stubAuthenticationContext } from "#lib/server/auth/context.fixture.js";
import { getAuthenticationContext } from "#lib/server/auth/context.js";
import { type AuthenticatedSession, AuthenticationSession } from "#lib/server/auth/session.js";
import { getNarrativeEngine } from "#lib/server/narrative-engine/context.js";

import { GET } from "./+server";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { HttpError } from "@a-novel-kit/nodelib-browser/http";
import { NarrativeEngineApi, projectLogoGet } from "@a-novel/service-narrative-engine-rest";

vi.mock("#lib/server/auth/context.js", { spy: true });
vi.mock("#lib/server/narrative-engine/context.js");
vi.mock("@a-novel/service-narrative-engine-rest", { spy: true });

const authenticated = vi.spyOn(AuthenticationSession.prototype, "authenticated");
const api = new NarrativeEngineApi("https://narrative-engine.test");
const projectID = "019a5f2e-0000-7000-8000-000000000001";

const signedIn: AuthenticatedSession = {
  status: "available",
  accessToken: "fixture-access",
  claims: { userID: "test-user", refreshTokenID: "test-refresh", roles: [] },
};

function event(id: string, query = "") {
  const cookies = { get: vi.fn(), set: vi.fn(), delete: vi.fn() };
  vi.mocked(getAuthenticationContext).mockReturnValue(stubAuthenticationContext(cookies));
  return {
    params: { id },
    url: new URL(`https://studio.test/projects/${id}/logo${query}`),
    cookies,
    getClientAddress: () => "192.0.2.1",
  } as unknown as Parameters<typeof GET>[0];
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getNarrativeEngine).mockReturnValue(api);
  authenticated.mockResolvedValue(signedIn);
});

describe("GET /projects/[id]/logo", () => {
  it("serves the writer's logo, kept for good by their browser under a versioned address", async () => {
    vi.mocked(projectLogoGet).mockResolvedValue(new Blob(["webp"], { type: "image/webp" }));

    const response = await GET(event(projectID, "?v=9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"));

    expect(response.status).toBe(200);
    expect(Object.fromEntries(response.headers)).toMatchObject({
      "cache-control": "private, max-age=31536000, immutable",
      "content-type": "image/webp",
      "x-content-type-options": "nosniff",
    });
    expect(projectLogoGet).toHaveBeenCalledExactlyOnceWith(api, "fixture-access", {
      projectID,
    });
  });

  it("revalidates a logo read without a version", async () => {
    vi.mocked(projectLogoGet).mockResolvedValue(new Blob(["jpeg"], { type: "image/jpeg" }));

    const response = await GET(event(projectID));

    expect(response.headers.get("cache-control")).toBe("private, no-cache");
  });

  it("answers 404 for an address that names no project, without a service call", async () => {
    const response = await GET(event("not-a-project"));

    expect(response.status).toBe(404);
    expect(authenticated).not.toHaveBeenCalled();
  });

  it("answers 401 to a visitor without an account session", async () => {
    authenticated.mockResolvedValue(null);

    await expect(GET(event(projectID))).resolves.toHaveProperty("status", 401);
    expect(projectLogoGet).not.toHaveBeenCalled();
  });

  it.each([
    ["a logo the writer does not hold", new HttpError(404, "not found"), 404],
    ["an outage", new Error("private detail"), 503],
  ])("answers %s without a body", async (_, error, status) => {
    vi.mocked(projectLogoGet).mockRejectedValue(error);

    const response = await GET(event(projectID));

    expect(response.status).toBe(status);
    await expect(response.text()).resolves.toBe("");
  });
});
