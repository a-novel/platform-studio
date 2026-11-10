import { PREFERENCE_LIFETIME_S } from "@a-novel-kit/nodelib-browser/preferences";

/** How many columns the projects take, where the page is wide enough for them. */
export type ProjectColumns = 1 | 2 | 3;

/** Names the cookie that keeps the columns, which the server reads to render them from the start. */
export const PROJECT_COLUMNS_COOKIE = "project-columns";

/** Reads the columns from the cookie's value. The projects take one column unless the writer chose more. */
export function parseProjectColumns(value: string | undefined): ProjectColumns {
  return value === "2" ? 2 : value === "3" ? 3 : 1;
}

/** Keeps the columns in a cookie for a year. */
export function saveProjectColumns(columns: ProjectColumns): void {
  document.cookie = `${PROJECT_COLUMNS_COOKIE}=${columns}; Path=/; Max-Age=${PREFERENCE_LIFETIME_S}; SameSite=Lax`;
}
