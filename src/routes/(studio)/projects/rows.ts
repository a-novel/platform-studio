import type { StoredProject } from "#lib/client/projects/database.js";
import type { ProjectsSyncState } from "#lib/client/projects/sync.svelte.js";

import type { ProjectRow, ProjectsModel } from "./controller.svelte";

/** Turns the projects the browser database holds into the page's model, most recently edited first. */
export function projectsModel(state: ProjectsSyncState): ProjectsModel {
  if (state.status !== "ready") return state;

  const projects = state.projects.map(projectRow).toSorted((a, b) => b.editedAt.getTime() - a.editedAt.getTime());
  return { status: "ready", now: new Date(state.readAt), projects };
}

/** Turns a project into its row, whose logo loads from Studio under an address that names its checksum. */
export function projectRow(project: StoredProject): ProjectRow {
  return {
    id: project.id,
    title: project.title,
    premise: project.premise,
    language: project.language,
    genres: project.genres,
    tags: project.tags,
    createdAt: project.createdAt,
    editedAt: project.editedAt,
    logo: project.logoChecksum ? logoHref(project.id, project.logoChecksum) : undefined,
  };
}

function logoHref(projectID: string, checksum: string): string {
  return `/projects/${projectID}/logo?${new URLSearchParams({ v: checksum })}`;
}
