import type { ProjectRow } from "./controller.svelte";

/** A project with the text a search reads in it, folded once, so each keystroke folds only the query. */
export interface SearchableProject {
  project: ProjectRow;
  /** The title, the premise, each tag and each genre's name, folded, a line apart, so no word spans two of them. */
  text: string;
}

/** Names the address's parameter that holds the query. */
const queryParameter = "q";

/** Folds case and accents away, as uikit's ChipGroup does, so a search for "epopee" finds "Épopée". */
function fold(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase();
}

/**
 * Prepares the projects for a search. A genre reads as the row names it: in the interface's language, by the value
 * a project stores, and as that value when the list does not know it.
 */
export function searchableProjects(
  projects: readonly ProjectRow[],
  genres: Readonly<Record<string, string>>
): SearchableProject[] {
  return projects.map((project) => ({ project, text: fold(searchedText(project, genres)) }));
}

function searchedText(project: ProjectRow, genres: Readonly<Record<string, string>>): string {
  const genreNames = project.genres.map((genre) => genres[genre] ?? genre);
  return [project.title, project.premise, ...project.tags, ...genreNames].join("\n");
}

/** Keeps the projects that hold every word of the query, whatever its case and accents. Spaces alone keep them all. */
export function searchProjects(projects: readonly SearchableProject[], query: string): ProjectRow[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  return projects.filter(({ text }) => words.every((word) => text.includes(word))).map(({ project }) => project);
}

/** Reads the query from the address's parameters, empty without one. */
export function readProjectsQuery(parameters: Pick<URLSearchParams, "get">): string {
  return parameters.get(queryParameter) ?? "";
}

/** Returns a copy of the address that holds the query, or no query parameter for an empty one, keeping the rest. */
export function withProjectsQuery(url: URL, query: string): URL {
  const next = new URL(url);
  next.searchParams.delete(queryParameter);
  if (query) next.searchParams.set(queryParameter, query);
  return next;
}
