export * from "./init";

const AGORA_TITLE = "Agora Studio";

export function pageTitle(...titles: string[]): string {
  return [...titles, AGORA_TITLE].join(" | ");
}
