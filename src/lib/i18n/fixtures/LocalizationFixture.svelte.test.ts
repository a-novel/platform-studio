import { createRequestI18n } from "../instance";
import LocalizationFixture from "./LocalizationFixture.svelte";

import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { page } from "vitest/browser";

describe("LocalizationFixture", () => {
  it("renders the French plural and context state from injected logic", async () => {
    const i18n = await createRequestI18n("fr");

    render(LocalizationFixture, {
      t: i18n.getFixedT("fr", "common"),
      count: 2,
      perspective: "reader",
    });

    await expect.element(page.getByRole("heading", { name: "Les traductions statiques sont prêtes" })).toBeVisible();
    await expect.element(page.getByText("2 éléments", { exact: true })).toBeVisible();
    await expect.element(page.getByText("Vue lecteur", { exact: true })).toBeVisible();
    await expect.element(page.getByText("2 lecteurs collaborent", { exact: true })).toBeVisible();
  });
});
