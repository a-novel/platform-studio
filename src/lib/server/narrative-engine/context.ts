import { getRuntimeConfig } from "../runtime-config.server";
import { type ServiceFetchOptions, serviceHeaders } from "../service-fetch";

import type { ServerSentEvent } from "@a-novel/service-narrative-engine-rest";
import { NarrativeEngineApi } from "@a-novel/service-narrative-engine-rest";

import type { RequestEvent } from "@sveltejs/kit";
import type { ZodType } from "zod";

/** NarrativeEngineEvent is the part of a request the narrative engine client reads. */
export type NarrativeEngineEvent = Pick<RequestEvent, "getClientAddress">;

/**
 * Sends the narrative engine client's calls as Studio's calls to a service, with the narrative engine
 * token and the visitor's address. The client builds its requests on the global fetch, so this adds the
 * headers.
 */
class ServiceNarrativeEngineApi extends NarrativeEngineApi {
  constructor(
    baseUrl: string,
    private readonly identity: ServiceFetchOptions
  ) {
    super(baseUrl);
  }

  override async fetchVoid(input: string, init?: RequestInit): Promise<void> {
    await super.fetchVoid(input, await this.identify(init));
  }

  override async fetch<T>(input: string, validator?: ZodType<T>, init?: RequestInit): Promise<T> {
    return await super.fetch(input, validator, await this.identify(init));
  }

  override async fetchBlob(input: string, init?: RequestInit): Promise<Blob> {
    return await super.fetchBlob(input, await this.identify(init));
  }

  override async *stream(
    input: string,
    init: RequestInit,
    isLast: (event: ServerSentEvent) => boolean
  ): AsyncGenerator<ServerSentEvent> {
    yield* super.stream(input, await this.identify(init), isLast);
  }

  private async identify(init?: RequestInit): Promise<RequestInit> {
    return { ...init, headers: await serviceHeaders(this.identity, init?.headers) };
  }
}

/** Returns a narrative engine client that calls for the visitor of a request. */
export function getNarrativeEngine(event: NarrativeEngineEvent): NarrativeEngineApi {
  const config = getRuntimeConfig();

  return new ServiceNarrativeEngineApi(config.narrativeEngineServiceUrl, {
    serviceTokenPath: config.narrativeEngineServiceTokenPath,
    visitorAddress: event.getClientAddress(),
  });
}
