import { requireAuthorization } from "#lib/server/auth/authorization.js";
import { getNarrativeEngine } from "#lib/server/narrative-engine/context.js";

import { actions, load } from "./+page.server";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { HttpError } from "@a-novel-kit/nodelib-browser/http";
import {
  Language,
  NarrativeEngineApi,
  type Project,
  projectCreate,
  projectList,
  projectLogoDelete,
  projectLogoUpdate,
  projectUpdate,
} from "@a-novel/service-narrative-engine-rest";

import { redirect } from "@sveltejs/kit";

vi.mock("#lib/server/auth/authorization.js");
vi.mock("#lib/server/narrative-engine/context.js");
vi.mock("@a-novel/service-narrative-engine-rest", { spy: true });

type LoadEvent = Parameters<typeof load>[0];
type ActionEvent = Parameters<typeof actions.save>[0];

const api = new NarrativeEngineApi("https://narrative-engine.test");
const projectID = "019a5f2e-0000-7000-8000-000000000001";
const logoVersion = "2026-11-08T10:00:00.123456Z";

const project: Project = {
  id: projectID,
  title: "Les Heures claires",
  premise: "Marie attend un homme qui ne viendra pas.",
  language: Language.Fr,
  genres: ["drama"],
  tags: ["Roman maritime"],
  createdAt: new Date("2026-10-01T10:00:00Z"),
  updatedAt: new Date("2026-10-02T10:00:00Z"),
  editedAt: new Date("2026-11-08T10:00:00Z"),
  logoVersion,
};

function loadEvent(status: "anonymous" | "authenticated" | "error"): LoadEvent {
  return {
    parent: async () => ({ session: { status } }),
    cookies: { get: () => undefined },
    url: new URL("https://studio.test/projects?view=grid"),
  } as unknown as LoadEvent;
}

function saveEvent(fields: Record<string, string | File>): ActionEvent {
  const form = new FormData();
  for (const [name, value] of Object.entries(fields)) form.set(name, value);
  const request = new Request("https://studio.test/projects?/save", { method: "POST", body: form });
  return { request } as unknown as ActionEvent;
}

const logo = new File([new Uint8Array([1, 2, 3])], "logo", { type: "image/webp" });
const fields = { title: "  Les Heures claires  ", premise: "Marie attend.", language: "fr" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getNarrativeEngine).mockReturnValue(api);
  vi.mocked(requireAuthorization).mockResolvedValue({
    session: { accessToken: "fixture-access" },
  } as Awaited<ReturnType<typeof requireAuthorization>>);
});

describe("projects page load", () => {
  it("sends a visitor without an account straight to the sign-in, back to this page", async () => {
    await expect(load(loadEvent("anonymous"))).rejects.toMatchObject({
      status: 307,
      location: "/auth/sign-in?returnTo=%2Fprojects%3Fview%3Dgrid",
    });
    expect(projectList).not.toHaveBeenCalled();
  });

  it("lists nothing while the session cannot be checked", async () => {
    await expect(load(loadEvent("error"))).resolves.toEqual({ projects: null, columns: 1 });
    expect(projectList).not.toHaveBeenCalled();
  });

  it("lists the first page of the writer's projects with their total, and logo addresses that name their versions", async () => {
    vi.mocked(projectList).mockResolvedValue({ projects: [project], total: 41 });

    const data = await load(loadEvent("authenticated"));

    expect(projectList).toHaveBeenCalledExactlyOnceWith(api, "fixture-access", { limit: 20 });
    expect(data).toMatchObject({
      projects: {
        status: "ready",
        total: 41,
        projects: [
          {
            id: projectID,
            title: project.title,
            editedAt: project.editedAt,
            logo: `/projects/${projectID}/logo?v=2026-11-08T10%3A00%3A00.123456Z`,
          },
        ],
      },
    });
  });

  it.each([
    ["rate-limited", new HttpError(429, "too many requests")],
    ["unavailable", new Error("private detail")],
  ])("shows the page as %s when the narrative engine fails", async (status, error) => {
    vi.mocked(projectList).mockRejectedValue(error);

    await expect(load(loadEvent("authenticated"))).resolves.toEqual({ columns: 1, projects: { status } });
  });
});

describe("projects save action", () => {
  it("refuses invalid fields before checking the session", async () => {
    const result = await actions.save(saveEvent({ title: "   ", premise: "", language: "de" }));

    expect(result).toMatchObject({
      status: 400,
      data: {
        save: {
          status: "invalid",
          issues: [
            { field: "title", code: "required" },
            { field: "language", code: "required" },
          ],
        },
      },
    });
    expect(requireAuthorization).not.toHaveBeenCalled();
  });

  it("creates a project, then sets the logo the dialog chose", async () => {
    vi.mocked(projectCreate).mockResolvedValue({ ...project, layers: [] });
    vi.mocked(projectLogoUpdate).mockResolvedValue(project);

    await expect(actions.save(saveEvent({ ...fields, logo }))).resolves.toEqual({
      save: { status: "saved", projectID },
    });
    expect(projectCreate).toHaveBeenCalledExactlyOnceWith(api, "fixture-access", {
      title: "Les Heures claires",
      premise: "Marie attend.",
      language: Language.Fr,
      genres: [],
      tags: [],
    });
    expect(projectLogoUpdate).toHaveBeenCalledExactlyOnceWith(api, "fixture-access", { projectID }, expect.any(File));
  });

  it("finishes a project and removes a logo it no longer holds", async () => {
    vi.mocked(projectUpdate).mockResolvedValue(project);
    vi.mocked(projectLogoDelete).mockRejectedValue(new HttpError(404, "project not found"));

    await expect(actions.save(saveEvent({ ...fields, id: projectID, "logo-removed": "true" }))).resolves.toEqual({
      save: { status: "saved", projectID },
    });
    expect(projectUpdate).toHaveBeenCalledExactlyOnceWith(api, "fixture-access", {
      id: projectID,
      title: "Les Heures claires",
      premise: "Marie attend.",
      language: Language.Fr,
      genres: [],
      tags: [],
    });
    expect(projectLogoDelete).toHaveBeenCalledExactlyOnceWith(api, "fixture-access", {
      projectID,
    });
  });

  it.each([
    [
      "a full account",
      {},
      () => vi.mocked(projectCreate).mockRejectedValue(new HttpError(409, "full")),
      409,
      "projectsFull",
    ],
    [
      "a project gone",
      { id: projectID },
      () => vi.mocked(projectUpdate).mockRejectedValue(new HttpError(404, "not found")),
      404,
      "notFound",
    ],
    [
      "a rate limit",
      {},
      () => vi.mocked(projectCreate).mockRejectedValue(new HttpError(429, "slow down")),
      429,
      "tooManyAttempts",
    ],
    [
      "an outage",
      {},
      () => vi.mocked(projectCreate).mockRejectedValue(new Error("private detail")),
      503,
      "serviceUnavailable",
    ],
  ] as const)("fails the save on %s", async (_, extra, arrange, status, feedback) => {
    arrange();

    const result = await actions.save(saveEvent({ ...fields, ...extra }));

    expect(result).toEqual({ status, data: { save: { status: "failed", feedback } } });
    expect(JSON.stringify(result)).not.toContain("private detail");
  });

  it.each([
    ["the rule it broke", new HttpError(422, "refused", { reason: "dimensions" }), "dimensions"],
    ["its size", new HttpError(422, "refused", { reason: "size" }), "tooLarge"],
    ["unreadable without a reason", new HttpError(422, "refused"), "format"],
  ] as const)("names a refused logo by %s, on the project the save created", async (_, error, refusal) => {
    vi.mocked(projectCreate).mockResolvedValue({ ...project, layers: [] });
    vi.mocked(projectLogoUpdate).mockRejectedValue(error);

    await expect(actions.save(saveEvent({ ...fields, logo }))).resolves.toEqual({
      status: 422,
      data: { save: { status: "logo-refused", projectID, refusal } },
    });
  });

  it("keeps the created project when its logo meets an outage", async () => {
    vi.mocked(projectCreate).mockResolvedValue({ ...project, layers: [] });
    vi.mocked(projectLogoUpdate).mockRejectedValue(new HttpError(503, "down"));

    await expect(actions.save(saveEvent({ ...fields, logo }))).resolves.toEqual({
      status: 503,
      data: { save: { status: "failed", feedback: "serviceUnavailable", projectID } },
    });
  });

  it("lets an ended session sign in again", async () => {
    vi.mocked(requireAuthorization).mockImplementation(() => redirect(303, "/auth/sign-in?returnTo=%2Fprojects"));

    await expect(actions.save(saveEvent(fields))).rejects.toMatchObject({ status: 303 });
    expect(projectCreate).not.toHaveBeenCalled();
  });
});
