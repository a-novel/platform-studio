import { getRuntimeConfig } from "../runtime-config.server";
import { serviceFetch } from "../service-fetch";

import { NarrativeEngineApi } from "@a-novel/service-narrative-engine-rest";

import type { RequestEvent } from "@sveltejs/kit";

/** NarrativeEngineEvent is the part of a request the narrative engine client reads. */
export type NarrativeEngineEvent = Pick<RequestEvent, "getClientAddress">;

/** Returns a narrative engine client that calls for the visitor of a request. */
export function getNarrativeEngine(event: NarrativeEngineEvent): NarrativeEngineApi {
  const config = getRuntimeConfig();

  // The client sends every call through the platform's fetch, with the narrative engine token and the visitor's
  // address.
  return new NarrativeEngineApi(
    config.narrativeEngineServiceUrl,
    serviceFetch({
      serviceTokenPath: config.narrativeEngineServiceTokenPath,
      visitorAddress: event.getClientAddress(),
    })
  );
}
