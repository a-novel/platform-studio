import { type StoredProject, projectsDatabaseName } from "./database";
import type { SweepApi } from "./scheduler";
import { type ProjectsSync, type ProjectsVisitor, createProjectsSync } from "./sync.svelte";

import { describe, expect, it, onTestFinished, vi } from "vitest";

import { HttpError } from "@a-novel-kit/nodelib-browser/http";
import { Language } from "@a-novel/service-narrative-engine-rest";

vi.mock("#lib/client/telemetry.js", () => ({ telemetry: { captureError: vi.fn() } }));

const checksum = "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08";
const harbor: StoredProject = {
  id: "019a5f2e-0000-7000-8000-000000000001",
  title: "Les Heures claires",
  premise: "Marie attend.",
  language: Language.Fr,
  tags: [],
  genres: ["drama"],
  createdAt: new Date("2026-10-01T10:00:00Z"),
  updatedAt: new Date("2026-10-02T10:00:00.123Z"),
  editedAt: new Date("2026-11-08T10:00:00Z"),
  logoChecksum: checksum,
};
const salt: StoredProject = { ...harbor, id: "019a5f2e-0000-7000-8000-000000000002", title: "Salt" };

/** The narrative engine of an account holding the harbor, as the relays answer for it. */
function harborApi() {
  return {
    fieldsDrift: vi.fn<SweepApi["fieldsDrift"]>(async (held) => ({
      projects: held[harbor.id] === harbor.updatedAt.toISOString() ? [] : [{ ...harbor, logoChecksum: undefined }],
      removed: [],
    })),
    editsList: vi.fn<SweepApi["editsList"]>(async () => ({ edits: { [harbor.id]: harbor.editedAt } })),
    logosDrift: vi.fn<SweepApi["logosDrift"]>(async (held) => ({
      logos: held[harbor.id] === checksum ? {} : { [harbor.id]: checksum },
      removed: [],
    })),
  };
}

/** A fresh account, whose browser database the test deletes once it ends. */
function newAccount(): ProjectsVisitor & { status: "authenticated" } {
  const accountKey = crypto.randomUUID();
  onTestFinished(() => void indexedDB.deleteDatabase(projectsDatabaseName(accountKey)));
  return { status: "authenticated", accountKey };
}

/** Follows the visitor as a tab of Studio would, until `close` or the end of the test. */
function openTab(getVisitor: () => ProjectsVisitor, api: SweepApi) {
  let sync: ProjectsSync | undefined;
  const close = $effect.root(() => {
    sync = createProjectsSync(getVisitor, api);
  });
  onTestFinished(close);
  return { sync: sync!, close };
}

async function databaseNames(): Promise<string[]> {
  return (await indexedDB.databases()).flatMap(({ name }) => (name?.startsWith("projects-") ? [name] : []));
}

describe("createProjectsSync", () => {
  it("shows every project of the account once the first sweeps land", async () => {
    const api = harborApi();
    const account = newAccount();
    const { sync } = openTab(() => account, api);
    expect(sync.state.status).toBe("starting");

    await expect.poll(() => sync.state.status === "ready" && sync.state.projects).toEqual([harbor]);
    expect(api.fieldsDrift).toHaveBeenCalledExactlyOnceWith({});
  });

  it("shows what the browser database holds on the next visit, before a sweep answers", async () => {
    const account = newAccount();
    const first = openTab(() => account, harborApi());
    await expect.poll(() => first.sync.state.status === "ready" && first.sync.state.projects).toEqual([harbor]);
    first.close();

    const pending = harborApi();
    pending.fieldsDrift.mockReturnValue(new Promise(() => {}));
    const { sync } = openTab(() => account, pending);

    await expect.poll(() => sync.state.status === "ready" && sync.state.projects).toEqual([harbor]);
  });

  it("runs each sweep in one tab at a time, and shows a project another tab saved at once", async () => {
    const account = newAccount();
    const api = harborApi();
    const first = openTab(() => account, api);
    await expect.poll(() => first.sync.state.status).toBe("ready");
    const second = openTab(() => account, api);
    await expect.poll(() => second.sync.state.status).toBe("ready");

    await first.sync.save(salt);

    await expect
      .poll(() => second.sync.state.status === "ready" && second.sync.state.projects.map(({ id }) => id))
      .toEqual([harbor.id, salt.id]);
    // A hard load sweeps the fields and edits whatever their last run, and the logos only once they fall due.
    expect(api.fieldsDrift).toHaveBeenCalledTimes(2);
    expect(api.logosDrift).toHaveBeenCalledOnce();
  });

  it("keeps only the signed-in account's browser database, and none once the visitor signs out", async () => {
    const other = newAccount();
    const leaving = openTab(() => other, harborApi());
    await expect.poll(() => leaving.sync.state.status).toBe("ready");
    leaving.close();

    const account = newAccount();
    let visitor = $state<ProjectsVisitor>(account);
    const { sync } = openTab(() => visitor, harborApi());
    await expect.poll(() => sync.state.status).toBe("ready");
    await expect.poll(databaseNames).toEqual([projectsDatabaseName(account.accountKey)]);

    // A session that cannot be checked hides who the visitor is, so the browser database stays.
    visitor = { status: "loading" };
    await expect.poll(() => sync.state.status).toBe("starting");
    expect(await databaseNames()).toEqual([projectsDatabaseName(account.accountKey)]);

    visitor = { status: "anonymous" };
    await expect.poll(databaseNames).toEqual([]);
  });

  it.each([
    ["rate-limited", new HttpError(429, "slow down")],
    ["unavailable", new HttpError(503, "down")],
  ] as const)("shows the projects %s when the first fields sweep fails", async (status, error) => {
    const api = harborApi();
    api.fieldsDrift.mockRejectedValue(error);
    const account = newAccount();
    const { sync } = openTab(() => account, api);

    await expect.poll(() => sync.state.status).toBe(status);
  });
});
