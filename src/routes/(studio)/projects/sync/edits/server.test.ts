import { requireAuthorization } from "#lib/server/auth/authorization.js";
import { getNarrativeEngine } from "#lib/server/narrative-engine/context.js";

import { GET } from "./+server";

import { describe, expect, it, vi } from "vitest";

import { NarrativeEngineApi, projectEditsList } from "@a-novel/service-narrative-engine-rest";

vi.mock("#lib/server/auth/authorization.js");
vi.mock("#lib/server/narrative-engine/context.js");
vi.mock("@a-novel/service-narrative-engine-rest", { spy: true });

describe("GET /projects/sync/edits", () => {
  it("relays the editedAt of each of the writer's projects, with their session", async () => {
    const api = new NarrativeEngineApi("https://narrative-engine.test");
    const projectID = "019a5f2e-0000-7000-8000-000000000001";
    vi.mocked(getNarrativeEngine).mockReturnValue(api);
    vi.mocked(requireAuthorization).mockResolvedValue({
      session: { accessToken: "fixture-access" },
    } as Awaited<ReturnType<typeof requireAuthorization>>);
    vi.mocked(projectEditsList).mockResolvedValue({ edits: { [projectID]: new Date("2026-11-08T10:00:00Z") } });

    const response = await GET({} as Parameters<typeof GET>[0]);

    expect(projectEditsList).toHaveBeenCalledExactlyOnceWith(api, "fixture-access");
    await expect(response.json()).resolves.toEqual({ edits: { [projectID]: "2026-11-08T10:00:00.000Z" } });
  });
});
