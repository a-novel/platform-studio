import type { Downtime } from "@a-novel-kit/nodelib-server";

/** Components whose planned downtime stops Studio features: Authentication, and JSON Keys, which signs its tokens. */
const studioComponents = new Set(["service-authentication.database", "service-json-keys.database"]);

/** Keeps a planned downtime only when it stops Studio features. */
export function studioDowntime(downtime: Downtime | null): Downtime | null {
  return downtime?.components.some((component) => studioComponents.has(component)) ? downtime : null;
}
