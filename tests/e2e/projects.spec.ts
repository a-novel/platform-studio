import { expect, home, signIn, test } from "./fixtures";

import { fileURLToPath } from "node:url";

import { screenshot } from "@a-novel-kit/nodelib-test/playwright";

import type { Locator, Page } from "playwright/test";

const logo = fileURLToPath(new URL("pictures/logo.png", import.meta.url));

/** Expects these rows in this order, by their names: a row showing its logo has no title text to read. */
async function expectRows(page: Page, names: string[]) {
  const rows = page.getByRole("article");
  await expect(rows).toHaveCount(names.length);
  for (const [index, name] of names.entries()) await expect(rows.nth(index)).toHaveAccessibleName(name);
}

/** Whether a row's image loaded from Studio, which relays it from the narrative engine. */
async function loaded(image: Locator): Promise<boolean> {
  return await image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0);
}

test("the root address sends a visitor without an account straight to the login", async ({ page }) => {
  const projects = page.waitForRequest((request) => new URL(request.url()).pathname === home);
  await page.goto("/");

  await projects;
  await expect(page.getByRole("dialog", { name: "Log in" })).toBeVisible();
});

// A phone opens the genres on their own screen: its field opens it, and Done closes it.
async function chooseGenres(page: Page, dialog: Locator, isMobile: boolean, genres: readonly string[]) {
  if (isMobile) await dialog.getByRole("group", { name: "Genres", exact: true }).getByRole("button").click();
  const chips = isMobile ? page.getByRole("dialog", { name: "Genres", exact: true }) : dialog;
  for (const genre of genres) await chips.getByRole("checkbox", { name: genre, exact: true }).check({ force: true });
  if (isMobile) await chips.getByRole("button", { name: "Done", exact: true }).click();
}

test("a writer creates projects with a logo, genres and tags, and finds the last edited first", async ({
  page,
  account,
  isMobile,
}, info) => {
  await signIn(page, account);
  await expect(page.getByRole("heading", { name: "A home for your stories…" })).toBeVisible();

  // The first project, with a logo.
  await page.getByRole("button", { name: "Start crafting now", exact: true }).click();
  let dialog = page.getByRole("dialog", { name: "New project" });
  await dialog.getByRole("textbox", { name: "Title" }).fill("Les Heures claires");
  await dialog.getByRole("combobox", { name: "Language" }).click();
  await page.getByRole("option", { name: "Français", exact: true }).click();
  await dialog.getByRole("textbox", { name: "Premise" }).fill("Marie attend un homme qui ne viendra pas.");
  await chooseGenres(page, dialog, isMobile, ["Drama", "Historical"]);
  // A space ends each tag, written in lower-kebab-case.
  await dialog.getByRole("textbox", { name: "Tags" }).pressSequentially("Roman-Maritime Années-50 ");
  await dialog.getByLabel("Logo", { exact: true }).setInputFiles(logo);
  await dialog.getByRole("button", { name: "Create project", exact: true }).click();
  await expect(dialog).toBeHidden();

  const harbor = page.getByRole("article", { name: "Les Heures claires" });
  await expect(harbor.getByRole("img", { name: "Français", exact: true })).toBeVisible();
  await expect(harbor.getByText("Drama", { exact: true })).toBeVisible();
  await expect(harbor.getByText("Historical", { exact: true })).toBeVisible();
  await expect(harbor.getByText("roman-maritime", { exact: true })).toBeVisible();
  await expect(harbor.getByText("années-50", { exact: true })).toBeVisible();
  await expect(harbor.locator("img")).toHaveCount(1);
  for (const image of await harbor.locator("img").all()) await expect.poll(() => loaded(image)).toBe(true);

  // A second project, without pictures, goes first.
  await page.getByRole("button", { name: "Create", exact: true }).click();
  dialog = page.getByRole("dialog", { name: "New project" });
  await dialog.getByRole("textbox", { name: "Title" }).fill("Salt");
  await dialog.getByRole("button", { name: "Create project", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expectRows(page, ["Salt", "Les Heures claires"]);
  await screenshot(page, info, "projects");
});
