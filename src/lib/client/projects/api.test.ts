import { relayApi } from "./api";

import { afterEach, describe, expect, it, vi } from "vitest";

import { isHttpStatusError } from "@a-novel-kit/nodelib-browser/http";

const projectID = "019a5f2e-0000-7000-8000-000000000001";
const updatedAt = "2026-10-02T10:00:00.123Z";

function stubFetch(answer: () => Response) {
  const fetch = vi.fn<typeof globalThis.fetch>(async () => answer());
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("relayApi", () => {
  it("posts the projects held to the fields relay, and reads the projects that drifted", async () => {
    const fetch = stubFetch(() =>
      Response.json({
        projects: [
          {
            id: projectID,
            title: "Salt",
            premise: "",
            language: "en",
            tags: [],
            genres: [],
            createdAt: "2026-10-01T10:00:00Z",
            updatedAt,
            editedAt: "2026-11-08T10:00:00Z",
          },
        ],
        removed: [],
      })
    );

    const answer = await relayApi.fieldsDrift({ [projectID]: updatedAt });

    expect(answer.projects[0]).toMatchObject({
      updatedAt: new Date(updatedAt),
      editedAt: new Date("2026-11-08T10:00:00Z"),
    });
    const [url, init] = fetch.mock.calls[0] ?? [];
    expect(url).toBe("/projects/sync/fields");
    expect(init).toMatchObject({ method: "POST", redirect: "manual" });
    expect(new Headers(init?.headers).get("content-type")).toBe("application/json");
    expect(JSON.parse(String(init?.body))).toEqual({ projects: { [projectID]: updatedAt } });
  });

  it("reads the edits without following a redirect", async () => {
    const fetch = stubFetch(() => Response.json({ edits: { [projectID]: "2026-11-08T10:00:00Z" } }));

    await expect(relayApi.editsList()).resolves.toEqual({ edits: { [projectID]: new Date("2026-11-08T10:00:00Z") } });
    expect(fetch).toHaveBeenCalledExactlyOnceWith("/projects/sync/edits", { redirect: "manual" });
  });

  it("fails a sweep the relay refuses with its status", async () => {
    stubFetch(() => new Response(null, { status: 429 }));

    const failure = await relayApi.logosDrift({}).catch((error: unknown) => error);

    expect(isHttpStatusError(failure, 429)).toBe(true);
  });
});
