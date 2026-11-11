import type { ProjectIssue } from "./controller.svelte";

import { kebabTag } from "@a-novel-kit/uikit";
import {
  type Language,
  LanguageSchema,
  PROJECT_GENRES_MAX,
  PROJECT_TAGS_MAX,
  ProjectPremiseSchema,
  ProjectTagSchema,
  ProjectTitleSchema,
} from "@a-novel/service-narrative-engine-rest";

import { z } from "zod";

/** A project the dialog saves: its fields, and the change of its logo. */
export interface ProjectInput {
  /** The project to update. A form without one creates a project. */
  id?: string;
  title: string;
  premise: string;
  language: Language;
  genres: string[];
  tags: string[];
  /** A newly chosen logo, or `remove`. A form without either leaves the logo as it is. */
  logo?: File | "remove";
}

/** The dialog's form read, or the issues that keep it from saving. */
export type ProjectFormResult = { success: true; value: ProjectInput } | { success: false; issues: ProjectIssue[] };

/** Names the field that asks to remove a logo the form sends no file for. */
export const LOGO_REMOVED_FIELD = "logo-removed";

/** Reads the genres, one checked box each. */
function readGenres(form: FormData): string[] {
  return form.getAll("genres").filter((genre) => typeof genre === "string");
}

/** Reads the tags, written in one field and separated by commas. */
/**
 * Reads the tags the field sent, then the text still typed in it, which a form without scripting sends whole: a
 * space or a comma ends a tag, and each is written in lower-kebab-case, as the field writes them.
 */
function readTags(form: FormData): string[] {
  const values = form.getAll("tags").filter((value) => typeof value === "string");
  const tags = values.flatMap((value) => value.split(/[\s,]+/u)).map(kebabTag);

  return [...new Set(tags.filter(Boolean))];
}

/** Reads the project dialog's form. Each field follows the narrative engine's own rule. */
export function readProjectForm(form: FormData): ProjectFormResult {
  const id = text(form, "id");
  const title = text(form, "title").trim();
  const premise = text(form, "premise").trim();
  const language = LanguageSchema.safeParse(text(form, "language"));
  const genres = readGenres(form);
  const tags = readTags(form);

  const issues: ProjectIssue[] = [];
  if (!title) issues.push({ field: "title", code: "required" });
  else if (!ProjectTitleSchema.safeParse(title).success) issues.push({ field: "title", code: "tooLong" });
  if (!ProjectPremiseSchema.safeParse(premise).success) issues.push({ field: "premise", code: "tooLong" });
  if (!language.success) issues.push({ field: "language", code: "required" });
  if (genres.length > PROJECT_GENRES_MAX) issues.push({ field: "genres", code: "tooMany" });
  if (tags.length > PROJECT_TAGS_MAX) issues.push({ field: "tags", code: "tooMany" });
  else if (tags.some((tag) => !ProjectTagSchema.safeParse(tag).success))
    issues.push({ field: "tags", code: "tooLong" });

  // A project ID that is no UUID comes from no dialog, which leaves nothing to show for it.
  if (id && !z.uuid().safeParse(id).success) return { success: false, issues };
  if (!language.success || issues.length > 0) return { success: false, issues };

  return {
    success: true,
    value: { id: id || undefined, title, premise, language: language.data, genres, tags, logo: readLogo(form) },
  };
}

function readLogo(form: FormData): ProjectInput["logo"] {
  const file = form.get("logo");
  if (file instanceof File && file.size > 0) return file;

  return form.get(LOGO_REMOVED_FIELD) === "true" ? "remove" : undefined;
}

function text(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}
