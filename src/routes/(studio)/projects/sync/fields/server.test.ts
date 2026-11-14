import { requireAuthorization } from "#lib/server/auth/authorization.js";
import { getNarrativeEngine } from "#lib/server/narrative-engine/context.js";

import { POST } from "./+server";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { HttpError } from "@a-novel-kit/nodelib-browser/http";
import { Language, NarrativeEngineApi, projectFieldsDrift } from "@a-novel/service-narrative-engine-rest";

import { redirect } from "@sveltejs/kit";

vi.mock("#lib/server/auth/authorization.js");
vi.mock("#lib/server/narrative-engine/context.js");
vi.mock("@a-novel/service-narrative-engine-rest", { spy: true });

const api = new NarrativeEngineApi("https://narrative-engine.test");
const projectID = "019a5f2e-0000-7000-8000-000000000001";
const updatedAt = "2026-10-02T10:00:00.123Z";

function event(body: string) {
  const request = new Request("https://studio.test/projects/sync/fields", { method: "POST", body });
  return { request } as unknown as Parameters<typeof POST>[0];
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getNarrativeEngine).mockReturnValue(api);
  vi.mocked(requireAuthorization).mockResolvedValue({
    session: { accessToken: "fixture-access" },
  } as Awaited<ReturnType<typeof requireAuthorization>>);
});

describe("POST /projects/sync/fields", () => {
  it("relays the fields that drifted, with the writer's session", async () => {
    vi.mocked(projectFieldsDrift).mockResolvedValue({
      projects: [
        {
          id: projectID,
          title: "Salt",
          premise: "",
          language: Language.En,
          tags: [],
          genres: [],
          createdAt: new Date("2026-10-01T10:00:00Z"),
          updatedAt: new Date(updatedAt),
          editedAt: new Date("2026-11-08T10:00:00Z"),
        },
      ],
      removed: [],
    });

    const response = await POST(event(JSON.stringify({ projects: { [projectID]: updatedAt } })));

    expect(projectFieldsDrift).toHaveBeenCalledExactlyOnceWith(api, "fixture-access", {
      projects: { [projectID]: updatedAt },
    });
    await expect(response.json()).resolves.toMatchObject({
      projects: [{ id: projectID, updatedAt, editedAt: "2026-11-08T10:00:00.000Z" }],
      removed: [],
    });
  });

  it.each([
    ["a body that is not JSON", "{"],
    ["a held project without a valid updatedAt", JSON.stringify({ projects: { [projectID]: "yesterday" } })],
  ])("refuses %s before checking the session", async (_, body) => {
    const response = await POST(event(body));

    expect(response.status).toBe(400);
    expect(requireAuthorization).not.toHaveBeenCalled();
  });

  it.each([
    ["a rate limit", new HttpError(429, "slow down"), 429],
    ["an outage", new Error("private detail"), 503],
  ])("answers %s without a body", async (_, error, status) => {
    vi.mocked(projectFieldsDrift).mockRejectedValue(error);

    const response = await POST(event(JSON.stringify({ projects: {} })));

    expect(response.status).toBe(status);
    await expect(response.text()).resolves.toBe("");
  });

  it("lets an ended session sign in again", async () => {
    vi.mocked(requireAuthorization).mockImplementation(() => redirect(303, "/auth/sign-in?returnTo=%2Fprojects"));

    await expect(POST(event(JSON.stringify({ projects: {} })))).rejects.toMatchObject({ status: 303 });
    expect(projectFieldsDrift).not.toHaveBeenCalled();
  });
});
