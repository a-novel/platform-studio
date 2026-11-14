import type { ProjectsChange, ProjectsDatabase, ProjectsSnapshot, SweepPart } from "./database";

import {
  PROJECTS_MAX,
  type ProjectEditsListResponse,
  type ProjectFieldsDriftResponse,
  type ProjectLogosDriftResponse,
} from "@a-novel/service-narrative-engine-rest";

/** How long each part waits after its last sweep before the next, in milliseconds. */
export const SWEEP_PERIODS: Readonly<Record<SweepPart, number>> = {
  fields: 5 * 60_000,
  edits: 60_000,
  logo: 15 * 60_000,
};

/** The narrative engine's drift checks, which Studio relays for the account signed in. */
export interface SweepApi {
  /** Sends the `updatedAt` of each project held, by ID. */
  fieldsDrift(projects: Record<string, string>): Promise<ProjectFieldsDriftResponse>;
  editsList(): Promise<ProjectEditsListResponse>;
  /** Sends the checksum of each logo held, by project ID. */
  logosDrift(logos: Record<string, string>): Promise<ProjectLogosDriftResponse>;
}

/** What the sweeps of one account run on, which the browser provides and a test fakes. */
export interface SweepEnvironment {
  database: ProjectsDatabase;
  api: SweepApi;
  /** Runs `task` while holding the lock `name`, which one tab holds at a time. */
  lock<T>(name: string, task: () => Promise<T>): Promise<T>;
  /** Whether the tab shows. A hidden tab holds its sweeps until `resume`. */
  visible(): boolean;
  /** Hears each change a sweep wrote to the browser database. */
  onWrite(): void;
  onFailure(part: SweepPart, error: unknown): void;
}

/** The running sweeps of one account. */
export interface Sweeps {
  /** Runs each sweep that fell due while the tab was hidden. */
  resume(): void;
  /** Clears every timer. A sweep under way finishes, and schedules nothing. */
  stop(): void;
}

/** What one sweep found: the change that brings the browser database in step. */
interface Drift {
  change: ProjectsChange;
  /** The part that must sweep at once, because this one found projects the other part has not seen. */
  next?: SweepPart;
}

/** How one run of a sweep ended. */
interface Outcome {
  /** When the part's last sweep ran, this one or another tab's; absent after a failure. */
  last?: number;
  /** The part that must sweep at once. */
  next?: SweepPart;
}

/** Asks the narrative engine what drifted in each part. */
const sweepParts: Record<SweepPart, (held: ProjectsSnapshot, api: SweepApi) => Promise<Drift>> = {
  fields: async ({ projects }, api) => {
    const ids = new Set(projects.map(({ id }) => id));
    // Past the account's cap, the browser holds a project deleted elsewhere, and the service refuses so long a map.
    // An empty one brings every project, and the held projects it lacks are gone.
    const full = projects.length > PROJECTS_MAX;
    const held = full ? {} : Object.fromEntries(projects.map(({ id, updatedAt }) => [id, updatedAt.toISOString()]));
    const answer = await api.fieldsDrift(held);
    const current = new Set(answer.projects.map(({ id }) => id));
    const removed = full ? [...ids].filter((id) => !current.has(id)) : answer.removed;
    // A project new to the browser has no logo held yet, so its logo comes at once rather than in up to 15 minutes.
    const added = [...current].some((id) => !ids.has(id));
    return { change: { fields: answer.projects, removed }, next: added ? "logo" : undefined };
  },
  edits: async ({ projects }, api) => {
    const { edits } = await api.editsList();
    const same = projects.length === Object.keys(edits).length && projects.every(({ id }) => Object.hasOwn(edits, id));
    return { change: { edits }, next: same ? undefined : "fields" };
  },
  logo: async ({ projects }, api) => {
    const held = projects.flatMap(({ id, logoChecksum }) => (logoChecksum ? [[id, logoChecksum]] : []));
    const answer = await api.logosDrift(Object.fromEntries(held));
    const removed = Object.fromEntries(answer.removed.map((id) => [id, null]));
    return { change: { logos: { ...answer.logos, ...removed } } };
  },
};

/**
 * Starts the sweeps of the browser database `name`, as a hard load does. The fields sweep runs at once, then the
 * edits sweep, whatever their last run, and the logo sweep when its last run is older than its period. Each part
 * then runs once per period while the tab shows, in one tab at a time. Edits that show projects added or removed
 * run the fields sweep at once, and fields that bring a project the browser lacked run the logo sweep at once.
 */
export function startSweeps(name: string, environment: SweepEnvironment): Sweeps {
  const timers = new Map<SweepPart, ReturnType<typeof setTimeout>>();
  const waiting = new Set<SweepPart>();
  let stopped = false;

  /** Sweeps one part, unless another tab swept it within its period and `force` is unset. */
  async function attempt(part: SweepPart, force: boolean): Promise<Outcome> {
    const held = await environment.database.read();
    const last = held.sweeps[part];
    if (!force && last !== undefined && Date.now() - last < SWEEP_PERIODS[part]) return { last };

    const at = Date.now();
    const { change, next } = await sweepParts[part](held, environment.api);
    await environment.database.write({ ...change, sweep: { part, at } });
    environment.onWrite();
    return { last: at, next };
  }

  async function run(part: SweepPart, force: boolean): Promise<void> {
    clearTimeout(timers.get(part));
    const outcome = await environment
      .lock(`${name}:${part}`, () => attempt(part, force))
      .catch((error: unknown): Outcome => {
        if (!stopped) environment.onFailure(part, error);
        return {};
      });
    if (stopped) return;

    // A failed sweep tries again a period later.
    const next = (outcome.last ?? Date.now()) + SWEEP_PERIODS[part];
    timers.set(
      part,
      setTimeout(() => due(part), next - Date.now())
    );
    if (outcome.next) await run(outcome.next, true);
  }

  function due(part: SweepPart) {
    if (environment.visible()) void run(part, false);
    else waiting.add(part);
  }

  void (async () => {
    // The other parts change only the projects held, which the fields bring.
    await run("fields", true);
    await Promise.all([run("edits", true), run("logo", false)]);
  })();

  return {
    resume() {
      for (const part of waiting) void run(part, false);
      waiting.clear();
    },
    stop() {
      stopped = true;
      for (const timer of timers.values()) clearTimeout(timer);
    },
  };
}
