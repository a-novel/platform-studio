import { requireAuthorization } from "#lib/server/auth/authorization.js";
import { getNarrativeEngine } from "#lib/server/narrative-engine/context.js";

import { POST } from "./+server";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { NarrativeEngineApi, projectLogosDrift } from "@a-novel/service-narrative-engine-rest";

vi.mock("#lib/server/auth/authorization.js");
vi.mock("#lib/server/narrative-engine/context.js");
vi.mock("@a-novel/service-narrative-engine-rest", { spy: true });

const api = new NarrativeEngineApi("https://narrative-engine.test");
const projectID = "019a5f2e-0000-7000-8000-000000000001";
const checksum = "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08";

function event(body: unknown) {
  const request = new Request("https://studio.test/projects/sync/logos", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return { request } as unknown as Parameters<typeof POST>[0];
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getNarrativeEngine).mockReturnValue(api);
  vi.mocked(requireAuthorization).mockResolvedValue({
    session: { accessToken: "fixture-access" },
  } as Awaited<ReturnType<typeof requireAuthorization>>);
});

describe("POST /projects/sync/logos", () => {
  it("relays the logos that drifted, with the writer's session", async () => {
    const answer = { logos: { [projectID]: checksum }, removed: [] };
    vi.mocked(projectLogosDrift).mockResolvedValue(answer);

    const response = await POST(event({ logos: {} }));

    expect(projectLogosDrift).toHaveBeenCalledExactlyOnceWith(api, "fixture-access", { logos: {} });
    await expect(response.json()).resolves.toEqual(answer);
  });

  it("refuses a held logo named by something other than a project ID, before checking the session", async () => {
    const response = await POST(event({ logos: { "not-a-project": checksum } }));

    expect(response.status).toBe(400);
    expect(requireAuthorization).not.toHaveBeenCalled();
  });
});
