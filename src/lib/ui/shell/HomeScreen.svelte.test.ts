import StudioI18nProvider from "$lib/i18n/StudioI18nProvider.svelte";

import HomeScreen from "./HomeScreen.svelte";

import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { page } from "vitest/browser";

describe("HomeScreen", () => {
  it("keeps an accessible title on the intentionally empty workspace", async () => {
    render(
      HomeScreen,
      {},
      {
        wrapper: StudioI18nProvider,
        wrapperProps: { locale: "en" },
      }
    );

    await expect.element(page.getByRole("heading", { name: "Home" })).toBeInTheDocument();
  });
});
