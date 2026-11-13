import { resolve } from "$app/paths";

import type { SweepApi } from "./scheduler";

import { HTTP_HEADERS, decodeHttpResponse, handleHttpResponse } from "@a-novel-kit/nodelib-browser/http";
import {
  ProjectEditsListResponseSchema,
  ProjectFieldsDriftResponseSchema,
  ProjectLogosDriftResponseSchema,
} from "@a-novel/service-narrative-engine-rest";

import type { ZodType } from "zod";

/**
 * Asks the narrative engine what drifted through Studio's relays, which add the visitor's session. A session that
 * ended answers a redirect to the sign-in, which fails the sweep: the next page load signs in again.
 */
export const relayApi: SweepApi = {
  fieldsDrift: (projects) => relay(resolve("projects/sync/fields"), ProjectFieldsDriftResponseSchema, { projects }),
  editsList: () => relay(resolve("projects/sync/edits"), ProjectEditsListResponseSchema),
  logosDrift: (logos) => relay(resolve("projects/sync/logos"), ProjectLogosDriftResponseSchema, { logos }),
};

/** Calls a relay, posting `body` when given, and decodes its answer. A status other than 2xx throws an `HttpError`. */
async function relay<T>(url: string, schema: ZodType<T>, body?: object): Promise<T> {
  const init: RequestInit = body
    ? { method: "POST", headers: HTTP_HEADERS.JSON, body: JSON.stringify(body), redirect: "manual" }
    : { redirect: "manual" };
  return fetch(url, init).then(handleHttpResponse).then(decodeHttpResponse(schema));
}
