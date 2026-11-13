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

import { describe, expect, it, onTestFinished, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { page, userEvent } from "vitest/browser";

import "@a-novel-kit/uikit-fonts/fonts.css";
import "@a-novel-kit/uikit-tokens/tokens.css";

const ready = { status: "ready", now, projects, total: projects.length } as const;

describe("projects screen", () => {
  it("starts the title as high without projects as over a list of them", async () => {
    // The title's distance from the top of the screen, in one state of the page.
    async function titleOffset(model: ProjectsModel) {
      const view = await render(ProjectsScreen, { controller: fixedProjectsController({ model }) }, withLocale());
      await expect.element(page.getByRole("heading", { name: "Projects", level: 1 })).toBeVisible();
      const offset =
        page.getByRole("heading", { level: 1 }).element().getBoundingClientRect().top -
        view.container.getBoundingClientRect().top;
      view.unmount();
      return offset;
    }

    const empty: ProjectsModel = { status: "ready", now, projects: [], total: 0 };
    expect(await titleOffset(empty)).toBeCloseTo(await titleOffset(ready), 0);
  });

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
    await expect.element(row.getByText("huis-clos")).toBeVisible();
    await expect.element(row.getByRole("button")).not.toBeInTheDocument();
  });

  it("names a genre in the reader's language, while the project keeps its identifier", async () => {
    // A phone opens the genres on their own screen, so the chips sit in the dialog on a wider one.
    await page.viewport(1280, 800);
    onTestFinished(() => page.viewport(414, 896));
    const rows = await render(
      ProjectsScreen,
      { controller: fixedProjectsController({ model: ready }) },
      withLocale("fr")
    );
    await expect.element(page.getByRole("article", { name: notebooks.title }).getByText("Psychologique")).toBeVisible();
    rows.unmount();

    const spy = vi.fn();
    const controller = fixedProjectsController({ model: ready, editor: newProjectEditor() }, spy);
    render(ProjectsScreen, { controller }, withLocale("fr"));
    await page.getByRole("dialog").getByRole("checkbox", { name: "Mystère" }).click();
    expect(spy).toHaveBeenCalledWith("genreChips.setValue", ["mystery"]);
  });

  it("counts the projects shown out of every project, and asks for the next page once the end comes near", async () => {
    const spy = vi.fn();
    const model: ProjectsModel = { ...ready, total: 41 };
    render(ProjectsScreen, { controller: fixedProjectsController({ model, more: "idle" }, spy) }, withLocale());

    await expect.element(page.getByText(`${ready.projects.length} / 41 projects`)).toBeVisible();
    const loader = page.getByText("Loading more projects");
    await expect.element(loader).toBeInTheDocument();
    loader.element().scrollIntoView();
    await expect.poll(() => spy.mock.calls).toContainEqual(["loadMore"]);
  });

  it("keeps each card at the long readable measure, centered, on a wide screen", async () => {
    await page.viewport(1920, 1080);
    onTestFinished(() => page.viewport(414, 896));
    render(ProjectsScreen, { controller: fixedProjectsController({ model: ready }) }, withLocale());
    const article = page.getByRole("article", { name: notebooks.title });
    await expect.element(article).toBeVisible();

    const card = article.element().closest("li")!;
    const measure = card.parentElement!.appendChild(document.createElement("div"));
    measure.style.inlineSize = "calc(var(--layout-readable-measure-long) + 2 * var(--space-4))";
    const expected = measure.getBoundingClientRect().width;
    measure.remove();

    const box = card.getBoundingClientRect();
    // An unknown token would leave both at the whole width, so the card must stay well under it.
    expect(box.width).toBeLessThan(window.innerWidth / 2);
    expect(box.width).toBeCloseTo(expected, 0);
    expect(box.left).toBeCloseTo(window.innerWidth - box.right, 0);
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
    const empty: ProjectsModel = { status: "ready", now, projects: [], total: 0 };
    render(ProjectsScreen, { controller: fixedProjectsController({ model: empty }, spy) }, withLocale("fr"));

    await expect.element(page.getByRole("heading", { name: "Un foyer pour vos histoires…" })).toBeVisible();
    await expect.element(page.getByRole("button", { name: "Créer" })).not.toBeInTheDocument();
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
    // A phone opens the genres on their own screen, so the chips sit in the dialog on a wider one.
    await page.viewport(1280, 800);
    onTestFinished(() => page.viewport(414, 896));
    const spy = vi.fn();
    const genres = ["fantasy", "horror"];
    const controller = fixedProjectsController({ model: ready, editor: newProjectEditor() }, spy, { genres });
    render(ProjectsScreen, { controller }, withLocale());

    const dialog = page.getByRole("dialog", { name: "New project" });
    await dialog.getByRole("textbox", { name: "Title" }).fill("Salt");
    await dialog.getByRole("textbox", { name: "Premise" }).fill("A lighthouse keeper's last winter.");
    // The chips show the controller's choice, so a click asks it to add the genre rather than checking the box.
    await dialog.getByRole("checkbox", { name: "Mystery" }).click();
    expect(spy).toHaveBeenCalledWith("genreChips.setValue", [...genres, "mystery"]);
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

    await page.getByRole("button", { name: "Remove lantern.png" }).click();
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
