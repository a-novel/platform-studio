import { type ProjectsChange, type ProjectsSnapshot, type StoredProject, applyChange } from "./database";
import { SWEEP_PERIODS, type SweepApi, startSweeps } from "./scheduler";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Language, PROJECTS_MAX } from "@a-novel/service-narrative-engine-rest";

const minute = 60_000;
const name = "projects-fixture-account-key";

function project(index: number, logoChecksum?: string): StoredProject {
  return {
    id: `019a5f2e-0000-7000-8000-00000000000${index}`,
    title: `Project ${index}`,
    premise: "",
    language: Language.En,
    tags: [],
    genres: [],
    createdAt: new Date("2026-10-01T10:00:00Z"),
    updatedAt: new Date(`2026-10-0${index}T10:00:00.123Z`),
    editedAt: new Date(`2026-11-0${index}T10:00:00Z`),
    logoChecksum,
  };
}

/** A browser database in memory, which applies changes as the real one does. */
function memoryDatabase(initial: Partial<ProjectsSnapshot> = {}) {
  const held = new Map((initial.projects ?? []).map((stored) => [stored.id, stored]));
  const sweeps = { ...initial.sweeps };
  return {
    sweeps,
    get projects() {
      return [...held.values()];
    },
    read: vi.fn(async (): Promise<ProjectsSnapshot> => ({ projects: [...held.values()], sweeps: { ...sweeps } })),
    write: vi.fn(async (change: ProjectsChange) => {
      const { put, remove } = applyChange([...held.values()], change);
      for (const stored of put) held.set(stored.id, stored);
      for (const id of remove) held.delete(id);
      if (change.sweep) sweeps[change.sweep.part] = change.sweep.at;
    }),
    close: vi.fn(),
  };
}

/** The narrative engine's drift checks over the projects the account holds. */
function fakeApi(account: StoredProject[]) {
  const logoOf = (id: string) => account.find((stored) => stored.id === id)?.logoChecksum;
  return {
    fieldsDrift: vi.fn<SweepApi["fieldsDrift"]>(async (held) => ({
      projects: account
        .filter((stored) => held[stored.id] !== stored.updatedAt.toISOString())
        .map((stored) => ({ ...stored, logoChecksum: undefined })),
      removed: Object.keys(held).filter((id) => !account.some((stored) => stored.id === id)),
    })),
    editsList: vi.fn<SweepApi["editsList"]>(async () => ({
      edits: Object.fromEntries(account.map((stored) => [stored.id, stored.editedAt])),
    })),
    logosDrift: vi.fn<SweepApi["logosDrift"]>(async (held) => ({
      logos: Object.fromEntries(
        account.flatMap((stored) =>
          stored.logoChecksum && held[stored.id] !== stored.logoChecksum ? [[stored.id, stored.logoChecksum]] : []
        )
      ),
      removed: Object.keys(held).filter((id) => !logoOf(id)),
    })),
  };
}

const checksum = "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08";
let account: StoredProject[];
let visible: boolean;

function sweeps(database = memoryDatabase()) {
  const api = fakeApi(account);
  const locks: string[] = [];
  const environment = {
    database,
    api,
    lock<T>(lockName: string, task: () => Promise<T>) {
      locks.push(lockName);
      return task();
    },
    visible: () => visible,
    onWrite: vi.fn(),
    onFailure: vi.fn(),
  };
  const running = startSweeps(name, environment);
  return { ...environment, locks, running };
}

/** Lets every pending promise settle: the fakes answer at once, so only the timers stay. */
function settle() {
  return new Promise((resolve) => setImmediate(resolve));
}

beforeEach(() => {
  vi.useFakeTimers({ now: new Date("2026-11-13T12:00:00Z"), toFake: ["setTimeout", "clearTimeout", "Date"] });
  account = [project(1, checksum), project(2)];
  visible = true;
});

afterEach(() => {
  vi.useRealTimers();
});

describe("startSweeps", () => {
  it("brings the fields first on a hard load, then the logos of the projects they brought, then the edits", async () => {
    const { database, api, locks, onWrite } = sweeps();
    await settle();

    expect(database.projects).toEqual(account);
    expect(database.sweeps).toEqual({ fields: Date.now(), edits: Date.now(), logo: Date.now() });
    expect(api.fieldsDrift).toHaveBeenCalledExactlyOnceWith({});
    expect(api.logosDrift).toHaveBeenCalledExactlyOnceWith({});
    expect(api.fieldsDrift.mock.invocationCallOrder[0]).toBeLessThan(api.editsList.mock.invocationCallOrder[0]!);
    // The hard load's own logo sweep finds it ran within its period, and skips.
    expect(locks).toEqual([`${name}:fields`, `${name}:logo`, `${name}:edits`, `${name}:logo`]);
    expect(onWrite).toHaveBeenCalledTimes(3);
  });

  it("brings the logo of a project created elsewhere at once, without waiting for the logo period", async () => {
    const { database, api } = sweeps();
    await settle();

    account = [...account, project(3, checksum)];
    api.editsList.mockImplementation(async () => ({
      edits: Object.fromEntries(account.map((stored) => [stored.id, stored.editedAt])),
    }));
    const elsewhere = fakeApi(account);
    api.fieldsDrift.mockImplementation(elsewhere.fieldsDrift);
    api.logosDrift.mockImplementation(elsewhere.logosDrift);
    vi.advanceTimersByTime(minute);
    await settle();

    expect(api.logosDrift).toHaveBeenCalledTimes(2);
    expect(database.projects.find(({ id }) => id === account[2]!.id)?.logoChecksum).toBe(checksum);
  });

  it("runs the fields and edits sweeps whatever their last run, and the logo sweep once it falls due", async () => {
    const recent = Date.now() - minute;
    const { api } = sweeps(
      memoryDatabase({ projects: account, sweeps: { fields: recent, edits: recent, logo: recent } })
    );
    await settle();

    expect(api.fieldsDrift).toHaveBeenCalledOnce();
    expect(api.editsList).toHaveBeenCalledOnce();
    expect(api.logosDrift).not.toHaveBeenCalled();

    vi.advanceTimersByTime(SWEEP_PERIODS.logo - minute);
    await settle();
    expect(api.logosDrift).toHaveBeenCalledExactlyOnceWith({ [account[0]!.id]: checksum });
  });

  it("skips a sweep another tab ran within its period, and runs it once that period passes", async () => {
    const { database, api } = sweeps();
    await settle();

    vi.advanceTimersByTime(minute / 2);
    database.sweeps.edits = Date.now();
    vi.advanceTimersByTime(minute / 2);
    await settle();
    expect(api.editsList).toHaveBeenCalledOnce();

    vi.advanceTimersByTime(minute / 2);
    await settle();
    expect(api.editsList).toHaveBeenCalledTimes(2);
  });

  it("brings the fields at once when the edits show a project created or deleted elsewhere", async () => {
    const { database, api } = sweeps();
    await settle();

    account = [account[1]!, project(3)];
    api.editsList.mockImplementation(async () => ({
      edits: Object.fromEntries(account.map((stored) => [stored.id, stored.editedAt])),
    }));
    api.fieldsDrift.mockImplementation(fakeApi(account).fieldsDrift);
    vi.advanceTimersByTime(minute);
    await settle();

    expect(api.fieldsDrift).toHaveBeenCalledTimes(2);
    expect(database.projects.map(({ id }) => id)).toEqual([account[0]!.id, account[1]!.id]);
  });

  it("sends nothing past the account's cap, and drops every project held that the full answer lacks", async () => {
    // A writer at the cap deleted a project elsewhere, then created one here: the browser holds one too many.
    const stale = { ...project(1), id: "019a5f2e-0000-7000-8000-0000000000ff" };
    account = Array.from({ length: PROJECTS_MAX }, (_, index) => ({ ...project(1), id: `held-${index}` }));
    const { database, api } = sweeps(memoryDatabase({ projects: [...account, stale] }));
    await settle();

    expect(api.fieldsDrift).toHaveBeenCalledExactlyOnceWith({});
    expect(database.projects.map(({ id }) => id)).toEqual(account.map(({ id }) => id));
  });

  it("holds the sweeps while the tab is hidden, and runs those overdue once it shows", async () => {
    const { api, running } = sweeps();
    await settle();

    visible = false;
    vi.advanceTimersByTime(SWEEP_PERIODS.fields);
    await settle();
    expect(api.editsList).toHaveBeenCalledOnce();

    visible = true;
    running.resume();
    await settle();
    expect(api.editsList).toHaveBeenCalledTimes(2);
    expect(api.fieldsDrift).toHaveBeenCalledTimes(2);
    expect(api.logosDrift).toHaveBeenCalledOnce();
  });

  it("reports a failed sweep and tries it again a period later", async () => {
    const database = memoryDatabase();
    const failure = new Error("offline");
    const api = fakeApi(account);
    api.editsList.mockRejectedValueOnce(failure);
    const onFailure = vi.fn();
    startSweeps(name, {
      database,
      api,
      lock: (_, task) => task(),
      visible: () => true,
      onWrite: () => {},
      onFailure,
    });
    await settle();
    expect(onFailure).toHaveBeenCalledExactlyOnceWith("edits", failure);
    expect(database.sweeps.edits).toBeUndefined();

    vi.advanceTimersByTime(minute - 1);
    await settle();
    expect(api.editsList).toHaveBeenCalledOnce();

    vi.advanceTimersByTime(1);
    await settle();
    expect(database.sweeps.edits).toBe(Date.now());
  });

  it("schedules nothing once stopped", async () => {
    const { api, running } = sweeps();
    await settle();

    running.stop();
    vi.advanceTimersByTime(SWEEP_PERIODS.logo);
    await settle();

    expect(api.fieldsDrift).toHaveBeenCalledOnce();
    expect(api.editsList).toHaveBeenCalledOnce();
  });
});
