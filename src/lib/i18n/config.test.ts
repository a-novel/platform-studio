import { resolveLocale } from "./config";

import { describe, expect, it } from "vitest";

describe("resolveLocale", () => {
  it.each([
    [null, "en"],
    ["", "en"],
    ["fr", "fr"],
    ["fr-FR", "fr"],
    ["de, fr;q=0.8, en;q=0.7", "fr"],
    ["fr;q=0.4, en;q=0.9", "en"],
    ["fr;q=0, *;q=1", "en"],
  ])("resolves %s to %s", (header, expected) => {
    expect(resolveLocale(header)).toBe(expected);
  });
});
