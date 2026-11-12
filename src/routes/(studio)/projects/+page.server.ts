import { signInHref } from "#lib/application/auth/navigation.js";
import { requireAuthorization } from "#lib/server/auth/authorization.js";
import { getNarrativeEngine } from "#lib/server/narrative-engine/context.js";

import type { Actions, PageServerLoad } from "./$types";
import { PROJECT_COLUMNS_COOKIE, parseProjectColumns } from "./columns";
import type { LogoRefusal, ProjectsModel, SaveFeedback, SaveResult } from "./controller.svelte";
import { readProjectForm } from "./project-form";
import { PROJECTS_PAGE, projectRow } from "./rows";

import { isHttpStatusError, isHttpError as isServiceError } from "@a-novel-kit/nodelib-browser/http";
import {
  type NarrativeEngineApi,
  PictureRefusal,
  type Project,
  projectCreate,
  projectList,
  projectLogoDelete,
  projectLogoUpdate,
  projectUpdate,
} from "@a-novel/service-narrative-engine-rest";

import { fail, isHttpError, isRedirect, redirect } from "@sveltejs/kit";

/**
 * Lists the first page of the writer's projects, most recently edited first, with how many they hold in all. A
 * visitor without an account goes straight to the sign-in, and comes back here once signed in.
 */
export const load: PageServerLoad = async (event) => {
  const { session } = await event.parent();
  if (session.status === "anonymous") redirect(307, signInHref(event.url.pathname + event.url.search));
  // An outage leaves the page to the layout's authorization, which says the session cannot be checked.
  const columns = parseProjectColumns(event.cookies.get(PROJECT_COLUMNS_COOKIE));
  if (session.status !== "authenticated") return { projects: null, columns };

  const { session: account } = await requireAuthorization(event);
  try {
    const page = await projectList(getNarrativeEngine(event), account.accessToken, { limit: PROJECTS_PAGE });
    const projects = page.projects.map(projectRow);
    return {
      columns,
      projects: { status: "ready", now: new Date(), projects, total: page.total } satisfies ProjectsModel,
    };
  } catch (error) {
    const status = isHttpStatusError(error, 429) ? "rate-limited" : "unavailable";
    return { columns, projects: { status } satisfies ProjectsModel };
  }
};

export const actions = {
  /**
   * Creates the project, or updates the one the form names, then sets or removes its logo. A
   * refused logo leaves the saved fields in place, so the next save finishes the project.
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

      const refused = await saveLogo(api, session.accessToken, project.id, logo);
      if (refused) return fail(refused.status, { save: refused.result });

      return { save: { status: "saved", projectID: project.id } satisfies SaveResult };
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

/** Sets or removes the logo of the project a save just wrote, and says why it could not. */
async function saveLogo(
  api: NarrativeEngineApi,
  accessToken: string,
  projectID: string,
  logo: File | "remove" | undefined
): Promise<{ status: number; result: SaveResult } | undefined> {
  const request = { projectID };
  try {
    if (logo === "remove") await projectLogoDelete(api, accessToken, request).catch(ignoreMissing);
    else if (logo) await projectLogoUpdate(api, accessToken, request, logo);
  } catch (error) {
    if (isHttpStatusError(error, 400, 413, 422)) {
      return { status: 422, result: { status: "logo-refused", projectID, refusal: refusal(error) } };
    }

    const { status, feedback } = serviceFeedback(error);
    return { status, result: { status: "failed", feedback, projectID } };
  }

  return undefined;
}

function ignoreMissing(error: unknown): void {
  if (!isHttpStatusError(error, 404)) throw error;
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
