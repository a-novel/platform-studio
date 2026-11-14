import { signInHref } from "#lib/application/auth/navigation.js";
import type { StoredProject } from "#lib/client/projects/database.js";
import { requireAuthorization } from "#lib/server/auth/authorization.js";
import { getNarrativeEngine } from "#lib/server/narrative-engine/context.js";

import type { Actions, PageServerLoad } from "./$types";
import { PROJECT_COLUMNS_COOKIE, parseProjectColumns } from "./columns";
import type { LogoRefusal, SaveFeedback, SaveResult } from "./controller.svelte";
import { readProjectForm } from "./project-form";

import { isHttpStatusError, isHttpError as isServiceError } from "@a-novel-kit/nodelib-browser/http";
import {
  type NarrativeEngineApi,
  PictureRefusal,
  type Project,
  projectCreate,
  projectLogoDelete,
  projectLogoUpdate,
  projectUpdate,
} from "@a-novel/service-narrative-engine-rest";

import { fail, isHttpError, isRedirect, redirect } from "@sveltejs/kit";

/**
 * Reads the columns the writer chose. The browser lists the projects from its own database. A visitor without an
 * account goes straight to the sign-in, and comes back here once signed in.
 */
export const load: PageServerLoad = async (event) => {
  const { session } = await event.parent();
  if (session.status === "anonymous") redirect(307, signInHref(event.url.pathname + event.url.search));

  return { columns: parseProjectColumns(event.cookies.get(PROJECT_COLUMNS_COOKIE)) };
};

export const actions = {
  /**
   * Creates the project, or updates the one the form names, then sets or removes its logo, and returns the project
   * as it saved. A refused logo leaves the saved fields in place, so the next save finishes the project.
   */
  save: async (event) => {
    const input = readProjectForm(await event.request.formData());
    if (!input.success) return fail(400, { save: { status: "invalid", issues: input.issues } satisfies SaveResult });

    try {
      const { session } = await requireAuthorization(event);
      const api = getNarrativeEngine(event);
      const { id, logo, ...fields } = input.value;

      let project: Project;
      try {
        project = id
          ? await projectUpdate(api, session.accessToken, { id, ...fields })
          : await projectCreate(api, session.accessToken, fields);
      } catch (error) {
        if (id && isHttpStatusError(error, 404)) return fail(404, failed("notFound"));
        if (!id && isHttpStatusError(error, 409)) return fail(409, failed("projectsFull"));
        throw error;
      }

      const logoSaved = await saveLogo(api, session.accessToken, project, logo);
      if ("result" in logoSaved) return fail(logoSaved.status, { save: logoSaved.result });

      return { save: { status: "saved", project: storedProject(logoSaved) } satisfies SaveResult };
    } catch (error) {
      if (isRedirect(error) || isHttpError(error)) throw error;

      const { status, feedback } = serviceFeedback(error);
      return fail(status, failed(feedback));
    }
  },
} satisfies Actions;

function failed(feedback: SaveFeedback) {
  return { save: { status: "failed", feedback } satisfies SaveResult };
}

/** Sets or removes the logo of the project a save just wrote, and returns the project with its logo, or why it could not. */
async function saveLogo(
  api: NarrativeEngineApi,
  accessToken: string,
  project: Project,
  logo: File | "remove" | undefined
): Promise<Project | { status: number; result: SaveResult }> {
  const request = { projectID: project.id };
  try {
    if (logo === "remove") return await projectLogoDelete(api, accessToken, request).catch(keepMissing(project));
    if (logo) return await projectLogoUpdate(api, accessToken, request, logo);
    return project;
  } catch (error) {
    const saved = storedProject(project);
    if (isHttpStatusError(error, 400, 413, 422)) {
      return { status: 422, result: { status: "logo-refused", project: saved, refusal: refusal(error) } };
    }

    const { status, feedback } = serviceFeedback(error);
    return { status, result: { status: "failed", feedback, project: saved } };
  }
}

/** Lets the save stand for a project deleted since it saved, without a logo: the next fields sweep drops it. */
function keepMissing(project: Project) {
  return (error: unknown): Project => {
    if (!isHttpStatusError(error, 404)) throw error;
    return { ...project, logoChecksum: undefined };
  };
}

/** Turns a saved project into the record the browser database takes, without its layers or logo version. */
function storedProject(project: Project): StoredProject {
  const { id, title, premise, language, tags, genres, createdAt, updatedAt, editedAt, logoChecksum } = project;
  return { id, title, premise, language, tags, genres, createdAt, updatedAt, editedAt, logoChecksum };
}

/** Reads the rule a refused logo broke from the service's problem tags. The router answers 413 for a body past its own limit. */
function refusal(error: unknown): LogoRefusal {
  if (isHttpStatusError(error, 413)) return "tooLarge";

  const reason = isServiceError(error) ? error.tags.reason : undefined;
  if (reason === PictureRefusal.Size) return "tooLarge";

  return reason === PictureRefusal.Dimensions ? reason : "format";
}

/** The narrative engine's own trouble, which a later try may get past. */
function serviceFeedback(error: unknown): { status: number; feedback: SaveFeedback } {
  return isHttpStatusError(error, 429)
    ? { status: 429, feedback: "tooManyAttempts" }
    : { status: 503, feedback: "serviceUnavailable" };
}
