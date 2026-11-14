import type { ProjectFields } from "@a-novel/service-narrative-engine-rest";

/** A project as the browser database holds it: its fields, with the checksum of its logo, absent without one. */
export type StoredProject = ProjectFields & { logoChecksum?: string };

/** One part of a project a sweep checks for drift. */
export type SweepPart = "fields" | "edits" | "logo";

/** Every project the browser database holds, with when each part's last sweep ran. */
export interface ProjectsSnapshot {
  projects: StoredProject[];
  /** The time of each part's last sweep, in milliseconds since the epoch. A part never swept is absent. */
  sweeps: Partial<Record<SweepPart, number>>;
}

/** One sweep's result or one local write, which the browser database applies whole or not at all. */
export interface ProjectsChange {
  /** Projects whose fields to write whole. A project held keeps its logo checksum. */
  fields?: readonly ProjectFields[];
  /** The `editedAt` of projects held, by ID. */
  edits?: Readonly<Record<string, Date>>;
  /** The logo checksum of projects held, by ID, null for a project without a logo. */
  logos?: Readonly<Record<string, string | null>>;
  /** The IDs of projects to drop. */
  removed?: readonly string[];
  /** The sweep this change ends, and when it started, in milliseconds since the epoch. */
  sweep?: { part: SweepPart; at: number };
}

/** The browser database of one account. */
export interface ProjectsDatabase {
  /** Reads every project and sweep time in one transaction. */
  read(): Promise<ProjectsSnapshot>;
  /** Applies a change in one readwrite transaction, so a reader never sees half of it. */
  write(change: ProjectsChange): Promise<void>;
  close(): void;
}

/** Starts the name of every account's browser database. */
const prefix = "projects-";
const version = 1;
const projectsStore = "projects";
const sweepsStore = "sweeps";

/** Names the browser database of the account a key names. */
export function projectsDatabaseName(accountKey: string): string {
  return prefix + accountKey;
}

/**
 * Lists what a change writes to the projects held: the records to put and the IDs to delete. Edits and logos
 * change only projects held, after the change's fields land. The service's `updatedAt` and `editedAt` only move
 * forward, so an older value, from a sweep that asked before a local save, leaves the newer one in place.
 */
export function applyChange(
  held: readonly StoredProject[],
  change: ProjectsChange
): { put: StoredProject[]; remove: string[] } {
  const projects = new Map(held.map((project) => [project.id, project]));
  const put = new Map<string, StoredProject>();
  const write = (project: StoredProject) => {
    projects.set(project.id, project);
    put.set(project.id, project);
  };

  for (const fields of change.fields ?? []) {
    const project = projects.get(fields.id);
    if (project && fields.updatedAt <= project.updatedAt) continue;
    // The edits sweep runs apart, so it may have brought a later editedAt than this answer holds.
    const editedAt = project && project.editedAt > fields.editedAt ? project.editedAt : fields.editedAt;
    write({ ...fields, editedAt, logoChecksum: project?.logoChecksum });
  }

  for (const [id, editedAt] of Object.entries(change.edits ?? {})) {
    const project = projects.get(id);
    if (project && editedAt > project.editedAt) write({ ...project, editedAt });
  }

  for (const [id, checksum] of Object.entries(change.logos ?? {})) {
    const project = projects.get(id);
    if (project && project.logoChecksum !== (checksum ?? undefined))
      write({ ...project, logoChecksum: checksum ?? undefined });
  }

  const remove = (change.removed ?? []).filter((id) => projects.has(id));
  for (const id of remove) put.delete(id);
  return { put: [...put.values()], remove };
}

/**
 * Opens the browser database the name gives, creating it on the first visit. A database a newer Studio upgraded
 * holds only a copy of the projects, so an older Studio deletes it and starts over. Another tab that deletes or
 * upgrades the database closes this connection, and `onClose` hears which of the two it did.
 */
export async function openProjectsDatabase(
  name: string,
  onClose: (deleted: boolean) => void
): Promise<ProjectsDatabase> {
  const database = await open(name).catch(async (error: unknown) => {
    if (!(error instanceof DOMException && error.name === "VersionError")) throw error;
    await request(indexedDB.deleteDatabase(name));
    return open(name);
  });
  // A deletion or an upgrade from another tab waits until every tab closes the database.
  database.onversionchange = (event) => {
    database.close();
    onClose(event.newVersion === null);
  };

  return {
    read: () => read(database),
    write: (change) => write(database, change),
    close: () => database.close(),
  };
}

/** Deletes the browser database of every account but the one named, or of every account when none is. */
export async function deleteProjectsDatabases(keep?: string): Promise<void> {
  for (const { name } of await indexedDB.databases()) {
    if (name?.startsWith(prefix) && name !== keep) indexedDB.deleteDatabase(name);
  }
}

function open(name: string): Promise<IDBDatabase> {
  const opening = indexedDB.open(name, version);
  opening.onupgradeneeded = () => {
    opening.result.createObjectStore(projectsStore, { keyPath: "id" });
    opening.result.createObjectStore(sweepsStore, { keyPath: "part" });
  };
  return request(opening);
}

async function read(database: IDBDatabase): Promise<ProjectsSnapshot> {
  const transaction = database.transaction([projectsStore, sweepsStore]);
  const [projects, sweeps] = await Promise.all([
    request<StoredProject[]>(transaction.objectStore(projectsStore).getAll()),
    request<{ part: SweepPart; at: number }[]>(transaction.objectStore(sweepsStore).getAll()),
  ]);
  return { projects, sweeps: Object.fromEntries(sweeps.map(({ part, at }) => [part, at])) };
}

async function write(database: IDBDatabase, change: ProjectsChange): Promise<void> {
  const transaction = database.transaction([projectsStore, sweepsStore], "readwrite");
  const projects = transaction.objectStore(projectsStore);

  // The transaction reads the projects again, so a write from another tab since the sweep's read stays.
  const { put, remove } = applyChange(await request<StoredProject[]>(projects.getAll()), change);
  for (const project of put) projects.put(project);
  for (const id of remove) projects.delete(id);
  if (change.sweep) transaction.objectStore(sweepsStore).put(change.sweep);

  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error);
  });
}

function request<T>(pending: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    pending.onsuccess = () => resolve(pending.result);
    pending.onerror = () => reject(pending.error);
  });
}
