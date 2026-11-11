import type { ProjectRow } from "./controller.svelte";

import type { Project } from "@a-novel/service-narrative-engine-rest";

/** How many projects a page of the list holds: the page loads the first, and scrolling loads the next ones. */
export const PROJECTS_PAGE = 20;

/** Turns a project into its row, whose logo loads from Studio under an address that names its version. */
export function projectRow(project: Project): ProjectRow {
  return {
    id: project.id,
    title: project.title,
    premise: project.premise,
    language: project.language,
    genres: project.genres,
    tags: project.tags,
    createdAt: project.createdAt,
    editedAt: project.editedAt,
    logo: project.logoVersion ? logoHref(project.id, project.logoVersion) : undefined,
  };
}

function logoHref(projectID: string, version: string): string {
  return `/projects/${projectID}/logo?${new URLSearchParams({ v: version })}`;
}

/** The rows of a later page not shown yet: a project edited since an earlier page moved up the list, and shows there. */
export function unseenRows(shown: readonly ProjectRow[], page: readonly ProjectRow[]): ProjectRow[] {
  const known = new Set(shown.map((row) => row.id));
  return page.filter((row) => !known.has(row.id));
}
