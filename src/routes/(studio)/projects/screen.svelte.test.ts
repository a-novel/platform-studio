import { withLocale } from "#lib/i18n/provider.fixture.js";

import type { ProjectsModel } from "./controller.svelte";
import {
  chosenLogo,
  fixedProjectsController,
  harbor,
  newProjectEditor,
  notebooks,
  now,
  projects,
} from "./projects.fixture";
import ProjectsScreen from "./screen.svelte";

import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { page, userEvent } from "vitest/browser";

import "@a-novel-kit/uikit-fonts/fonts.css";
import "@a-novel-kit/uikit-tokens/tokens.css";

const ready = { status: "ready", now, projects } as const;

describe("projects screen", () => {
  it("lists each project as a row with its language, genres and tags, which offers no edit", async () => {
    render(ProjectsScreen, { controller: fixedProjectsController({ model: ready }) }, withLocale());

    await expect.element(page.getByRole("heading", { name: "Projects", level: 1 })).toBeVisible();
    const titles = page
      .getByRole("heading", { level: 2 })
      .elements()
      .map((heading) => heading.querySelector("img")?.alt ?? heading.textContent);
    expect(titles).toEqual(projects.map(({ title }) => title));
    await expect.element(page.getByText("Edited 5 minutes ago")).toBeVisible();

    const row = page.getByRole("article", { name: notebooks.title });
    await expect.element(row.getByRole("img", { name: "Français" })).toBeVisible();
    await expect.element(row.getByText("Psychological")).toBeVisible();
    await expect.element(row.getByText("Huis clos")).toBeVisible();
    await expect.element(row.getByRole("button")).not.toBeInTheDocument();
  });

  it("shows a logo in place of the title, and takes no room for one the project lacks", async () => {
    render(ProjectsScreen, { controller: fixedProjectsController({ model: ready }) }, withLocale());

    const pictured = page.getByRole("article", { name: harbor.title });
    await expect.element(pictured.getByRole("img", { name: harbor.title })).toHaveAttribute("src", harbor.logo);
    await expect.element(pictured.getByText(harbor.title, { exact: true })).not.toBeInTheDocument();

    const plain = page.getByRole("article", { name: notebooks.title });
    await expect.element(plain.getByRole("heading", { level: 2 })).toHaveTextContent(notebooks.title);
    expect(plain.element().querySelector("img")).toBeNull();
  });

  it("invites a writer without projects to create the first one", async () => {
    const spy = vi.fn();
    const empty: ProjectsModel = { status: "ready", now, projects: [] };
    render(ProjectsScreen, { controller: fixedProjectsController({ model: empty }, spy) }, withLocale("fr"));

    await expect.element(page.getByRole("heading", { name: "Un foyer pour vos histoires…" })).toBeVisible();
    await expect.element(page.getByRole("button", { name: "Nouveau projet" })).not.toBeInTheDocument();
    await page.getByRole("button", { name: "Commencer à créer" }).click();
    expect(spy).toHaveBeenCalledExactlyOnceWith("create");
  });

  it("offers to reload when the projects cannot be read", async () => {
    render(ProjectsScreen, { controller: fixedProjectsController({ model: { status: "unavailable" } }) }, withLocale());

    await expect
      .element(page.getByRole("link", { name: "Reload page" }))
      .toHaveAttribute("data-sveltekit-reload", "true");
  });

  it("saves the dialog's fields through the controller", async () => {
    const spy = vi.fn();
    const controller = fixedProjectsController({ model: ready, editor: newProjectEditor() }, spy);
    render(ProjectsScreen, { controller }, withLocale());

    const dialog = page.getByRole("dialog", { name: "New project" });
    await dialog.getByRole("textbox", { name: "Title" }).fill("Salt");
    await dialog.getByRole("textbox", { name: "Premise" }).fill("A lighthouse keeper's last winter.");
    await dialog.getByRole("checkbox", { name: "Fantasy" }).click();
    await dialog.getByRole("checkbox", { name: "Horror" }).click();
    await dialog.getByRole("button", { name: "Create project" }).click();

    const form = spy.mock.calls.find(([request]) => request === "save")?.[1] as FormData | undefined;
    expect(form?.get("title")).toBe("Salt");
    expect(form?.get("premise")).toBe("A lighthouse keeper's last winter.");
    expect(form?.get("language")).toBe("en");
    expect(form?.getAll("genres")).toEqual(["fantasy", "horror"]);
  });

  it("chooses and removes the logo through the controller", async () => {
    const spy = vi.fn();
    render(
      ProjectsScreen,
      { controller: fixedProjectsController({ model: ready, editor: newProjectEditor({ logo: chosenLogo }) }, spy) },
      withLocale()
    );

    const file = new File(["image"], "logo.png", { type: "image/png" });
    await userEvent.upload(page.getByLabelText("Logo"), file);
    expect(spy).toHaveBeenCalledWith("chooseLogo", file);

    await page.getByRole("button", { name: "Remove picture" }).click();
    expect(spy).toHaveBeenCalledWith("removeLogo");
  });

  it("shows why the save failed above the dialog's actions", async () => {
    const editor = newProjectEditor({ failure: { status: "failed", feedback: "projectsFull" } });
    render(ProjectsScreen, { controller: fixedProjectsController({ model: ready, editor }) }, withLocale());

    await expect
      .element(page.getByRole("dialog").getByText("You already have 100 projects, the most an account can hold."))
      .toBeVisible();
  });
});
