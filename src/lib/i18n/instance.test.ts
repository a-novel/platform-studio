import { createRequestI18n } from "./instance";

import { describe, expect, it } from "vitest";

describe("createRequestI18n", () => {
  it("loads plain, plural, context, and context-plus-plural messages", async () => {
    const i18n = await createRequestI18n("en");

    expect(i18n.t("fixture.ready")).toBe("Static translations are ready");
    expect(i18n.t("fixture.items", { count: 2 })).toBe("2 items");
    expect(i18n.t("fixture.perspective", { context: "creator" })).toBe("Creator view");
    expect(i18n.t("fixture.collaborators", { context: "reader", count: 1 })).toBe("1 reader is collaborating");
  });

  it("keeps language state isolated between request instances", async () => {
    const [english, french] = await Promise.all([createRequestI18n("en"), createRequestI18n("fr")]);

    expect(english.t("fixture.ready")).toBe("Static translations are ready");
    expect(french.t("fixture.ready")).toBe("Les traductions statiques sont prêtes");

    await french.changeLanguage("en");

    expect(english.language).toBe("en");
    expect(french.language).toBe("en");
  });
});
