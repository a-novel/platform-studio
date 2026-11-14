import { telemetry } from "#lib/client/telemetry.js";

import {
  type ProjectsDatabase,
  type StoredProject,
  deleteProjectsDatabases,
  openProjectsDatabase,
  projectsDatabaseName,
} from "./database";
import { type SweepApi, type SweepEnvironment, startSweeps } from "./scheduler";

import { createContext } from "svelte";

import { isHttpError, isHttpStatusError } from "@a-novel-kit/nodelib-browser/http";

/** The account's projects as the browser database holds them, or where reading them stands. */
export type ProjectsSyncState =
  /** No account to follow yet: the server's render, the page before it runs, or a session that cannot be checked. */
  | { status: "starting" }
  /** Opening the browser database, or waiting for the first fields sweep it ever held. */
  | { status: "loading" }
  | {
      status: "ready";
      /** Every project of the account, as the last sweep or local write left it. */
      projects: readonly StoredProject[];
      /**
       * When the browser read its database, in milliseconds since the epoch. A sweep or a write from any tab makes it
       * read again.
       */
      readAt: number;
    }
  /** The first fields sweep failed, so the browser database holds nothing to show. */
  | { status: "unavailable" }
  | { status: "rate-limited" };

/** The visitor, as the shell's session names them: an account syncs its projects under its key. */
export type ProjectsVisitor =
  | { status: "anonymous" }
  | { status: "loading" }
  | {
      status: "authenticated";
      /** The SHA-256 of the account's user ID, which names its browser database without revealing the ID. */
      accountKey: string;
    };

/** The signed-in account's projects, which the browser keeps in step with the narrative engine for the whole app. */
export interface ProjectsSync {
  readonly state: ProjectsSyncState;
  /** Writes a project a save returned to the browser database at once, and tells the other tabs. */
  save(project: StoredProject): Promise<void>;
}

/** Reads and installs the projects sync, which the Studio layout installs for every page. */
export const [getProjectsSync, setProjectsSync] = createContext<ProjectsSync>();

/**
 * Follows the visitor's account: it drops every other account's browser database, then sweeps the account's own.
 * A visitor signed out drops them all, and a session that cannot be checked leaves them as they are. When another
 * tab deletes the database followed, `refreshVisitor` reads the session again, and the sync follows the account it
 * names anew. Call it during component initialization; the sweeps stop with the component.
 */
export function createProjectsSync(
  getVisitor: () => ProjectsVisitor,
  api: SweepApi,
  refreshVisitor: () => Promise<unknown>
): ProjectsSync {
  let state = $state.raw<ProjectsSyncState>({ status: "starting" });
  // Counts the restarts after another tab deleted the database followed: each follows the account again.
  let restarts = $state(0);
  // Writes a saved project to the database followed, while one is.
  let writeSaved: ((project: StoredProject) => Promise<void>) | undefined;

  // The account's key, null for a visitor signed out, and undefined while the session cannot be checked. Each load
  // replaces the session, and a value that stays the same keeps the sweeps running.
  const accountKey = $derived.by(() => {
    const visitor = getVisitor();
    if (visitor.status === "loading") return undefined;
    return visitor.status === "authenticated" ? visitor.accountKey : null;
  });

  $effect(() => {
    void restarts;
    if (accountKey === undefined) return;

    const name = accountKey === null ? undefined : projectsDatabaseName(accountKey);
    deleteProjectsDatabases(name).catch(report);
    if (!name) return;

    const owner = new AbortController();
    void follow(name, owner.signal);
    return () => {
      owner.abort();
      writeSaved = undefined;
      state = { status: "starting" };
    };
  });

  /**
   * Shows the browser database `name` and keeps it in step, until `following` aborts or another tab deletes or
   * upgrades the database. Either stops the sweeps and the saves. After a deletion the session is read again first,
   * since the other tab may have signed another account in, and the sync then follows the account it names. A newer
   * Studio's upgrade leaves this tab showing what it held until its next load: following again would delete the
   * newer database, which the newer tab would delete in turn.
   */
  async function follow(name: string, following: AbortSignal) {
    state = { status: "loading" };
    const deleted = new AbortController();
    const signal = AbortSignal.any([following, deleted.signal]);
    let database: ProjectsDatabase;
    try {
      database = await openProjectsDatabase(name, (deletedElsewhere) => {
        deleted.abort();
        if (deletedElsewhere) refreshVisitor().then(() => restarts++, report);
      });
    } catch (error) {
      report(error);
      if (!signal.aborted) state = { status: "unavailable" };
      return;
    }
    if (signal.aborted) return database.close();

    const channel = new BroadcastChannel(name);
    let reads = 0;
    async function show() {
      const read = ++reads;
      const { projects, sweeps } = await database.read();
      // Until a fields sweep ran once, the database holds no projects to trust.
      if (read === reads && !signal.aborted && sweeps.fields !== undefined) {
        state = { status: "ready", projects, readAt: Date.now() };
      }
    }
    function written() {
      show().catch(report);
      channel.postMessage(null);
    }

    const environment: SweepEnvironment = {
      database,
      api,
      lock: (lockName, task) => navigator.locks.request(lockName, task),
      visible: () => document.visibilityState === "visible",
      onWrite: written,
      onFailure(part, error) {
        // A browser offline, or just woken before its network, fails each sweep with no fault to report.
        if (!isHttpError(error) && navigator.onLine) report(error);
        if (part === "fields" && state.status !== "ready") {
          state = { status: isHttpStatusError(error, 429) ? "rate-limited" : "unavailable" };
        }
      },
    };
    const sweeps = startSweeps(name, environment);

    channel.onmessage = () => show().catch(report);
    document.addEventListener(
      "visibilitychange",
      () => {
        if (environment.visible()) sweeps.resume();
      },
      { signal }
    );
    writeSaved = async (project) => {
      await database.write({ fields: [project], logos: { [project.id]: project.logoChecksum ?? null } });
      written();
    };
    signal.addEventListener("abort", () => {
      sweeps.stop();
      channel.close();
      database.close();
      writeSaved = undefined;
    });

    // A visit after the first shows what the database holds while the sweeps run.
    show().catch(report);
  }

  return {
    get state() {
      return state;
    },
    async save(project) {
      // The next fields sweep brings a project the browser database could not take.
      await writeSaved?.(project).catch(report);
    },
  };
}

function report(error: unknown) {
  telemetry.captureError(error);
}
