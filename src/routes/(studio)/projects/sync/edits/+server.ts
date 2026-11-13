import { relay } from "../relay.server";
import type { RequestHandler } from "./$types";

import { projectEditsList } from "@a-novel/service-narrative-engine-rest";

/** Relays the edits sweep: the `editedAt` of each of the writer's projects. */
export const GET: RequestHandler = (event) => relay(event, projectEditsList);
