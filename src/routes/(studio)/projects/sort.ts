import type { ProjectRow } from "./controller.svelte";

import { PREFERENCE_LIFETIME_S } from "@a-novel-kit/nodelib-browser/preferences";

/** The field of a project the list sorts by. */
export type ProjectSortField = "editedAt" | "createdAt" | "title";

/** The direction of a sort. Ascending puts the oldest date and the first title first. */
export type SortOrder = "ascending" | "descending";

/** How the list sorts the projects. */
export interface ProjectSort {
  field: ProjectSortField;
  order: SortOrder;
}

/** The order each field starts in: the latest first for a date, A to Z for the title. */
export const NATURAL_ORDER: Readonly<Record<ProjectSortField, SortOrder>> = {
  editedAt: "descending",
  createdAt: "descending",
  title: "ascending",
};

/** The sort a writer who never chose one sees: the last edited first. */
export const DEFAULT_PROJECT_SORT: ProjectSort = { field: "editedAt", order: "descending" };

/** Names the cookie that keeps the sort, which the server reads to render it from the start. */
export const PROJECT_SORT_COOKIE = "project-sort";

/** A cookie value: the field, then the order. */
const cookieValue = /^(editedAt|createdAt|title)-(ascending|descending)$/;

/** Reads the sort from the cookie's value. The last edited project comes first unless the writer chose another sort. */
export function parseProjectSort(value: string | undefined): ProjectSort {
  const match = cookieValue.exec(value ?? "");
  return match ? { field: match[1] as ProjectSortField, order: match[2] as SortOrder } : DEFAULT_PROJECT_SORT;
}

/** Keeps the sort in a cookie for a year. */
export function saveProjectSort({ field, order }: ProjectSort): void {
  document.cookie = `${PROJECT_SORT_COOKIE}=${field}-${order}; Path=/; Max-Age=${PREFERENCE_LIFETIME_S}; SameSite=Lax`;
}

/**
 * Sorts the projects by the field, in the order. The collator compares titles in the interface's language. Projects
 * that tie keep the order of their IDs, whatever the order.
 */
export function sortProjects(
  projects: readonly ProjectRow[],
  { field, order }: ProjectSort,
  collator: Intl.Collator
): ProjectRow[] {
  const direction = order === "ascending" ? 1 : -1;
  return projects.toSorted((a, b) => direction * compareField(field, a, b, collator) || compareIDs(a, b));
}

function compareField(field: ProjectSortField, a: ProjectRow, b: ProjectRow, collator: Intl.Collator): number {
  if (field === "title") return collator.compare(a.title, b.title);
  return a[field].getTime() - b[field].getTime();
}

function compareIDs(a: ProjectRow, b: ProjectRow): number {
  if (a.id === b.id) return 0;
  return a.id < b.id ? -1 : 1;
}
