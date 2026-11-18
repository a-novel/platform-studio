import { withLocale } from "#lib/i18n/provider.fixture.js";

import {
  PROJECTS_PAGE,
  type ProjectsControllerOptions,
  type ProjectsModel,
  createProjectsController,
} from "./controller.svelte";
import {
  cartographer,
  chosenLogo,
  fixedProjectsController,
  harbor,
  manyProjects,
  newProjectEditor,
  notebooks,
  now,
  projects,
  salt,
} from "./projects.fixture";
import ProjectsScreen from "./screen.svelte";
import { readProjectsQuery } from "./search";
import { DEFAULT_PROJECT_SORT } from "./sort";

import { flushSync } from "svelte";

import { describe, expect, it, onTestFinished, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { page, userEvent } from "vitest/browser";

import "@a-novel-kit/uikit-fonts/fonts.css";
import "@a-novel-kit/uikit-tokens/tokens.css";
import { Language } from "@a-novel/service-narrative-engine-rest";

const ready = { status: "ready", now, projects } as const;

/** The default controller over the fixture's projects, in English, with no query in the address. */
function projectsController(options: Partial<ProjectsControllerOptions> = {}) {
  return createProjectsController({
    getModel: () => ready,
    defaultLanguage: Language.En,
    language: "en",
    genres: {},
    retryHref: "/projects",
    initialColumns: 1,
    getQuery: () => "",
    initialSort: DEFAULT_PROJECT_SORT,
    submit: vi.fn(),
    ...options,
  });
}

/** The names of the rows shown, in order: a row showing its logo has no title text to read. */
function rowNames(): (string | null)[] {
  return page
    .getByRole("article")
    .elements()
    .map((row) => row.querySelector("img")?.alt ?? row.querySelector("h2")?.textContent ?? null);
}

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

    const empty: ProjectsModel = { status: "ready", now, projects: [] };
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

  it("counts every project of the list, not only the page shown, and asks for the next page once the end comes near", async () => {
    const spy = vi.fn();
    const controller = fixedProjectsController({ model: ready, pages: [projects.slice(0, 2)], more: true }, spy);
    render(ProjectsScreen, { controller }, withLocale());

    await expect.element(page.getByText(`${projects.length} projects`)).toBeVisible();
    const loader = page.getByText("Loading more projects");
    await expect.element(loader).toBeInTheDocument();
    loader.element().scrollIntoView();
    await expect.poll(() => spy.mock.calls).toContainEqual(["loadMore"]);
  });

  it("shows page after page as the writer scrolls, until every project shows", async () => {
    const rows = manyProjects(2 * PROJECTS_PAGE + 3);
    const controller = projectsController({ getModel: () => ({ status: "ready", now, projects: rows }) });
    render(ProjectsScreen, { controller }, withLocale());

    const cards = page.getByRole("article");
    await expect.poll(() => cards.elements().length).toBe(PROJECTS_PAGE);
    for (const shown of [2 * PROJECTS_PAGE, rows.length]) {
      page.getByText("Loading more projects").element().scrollIntoView();
      await expect.poll(() => cards.elements().length).toBe(shown);
    }
    await expect.element(page.getByText("Loading more projects")).not.toBeInTheDocument();
  });

  it("searches as the writer types, counts the results, and flips the order from the header", async () => {
    // A wide screen, where every project fits on the first page and the header holds the search and the sort.
    await page.viewport(1280, 800);
    onTestFinished(() => page.viewport(414, 896));
    const onSearch = vi.fn();
    const onSortChange = vi.fn();
    render(ProjectsScreen, { controller: projectsController({ onSearch, onSortChange }) }, withLocale());

    await page.getByRole("searchbox", { name: "Search projects" }).fill("car");
    await expect.poll(rowNames).toEqual([cartographer.title, notebooks.title]);
    await expect.element(page.getByText("2 results")).toBeVisible();
    expect(onSearch).toHaveBeenLastCalledWith("car");

    await page.getByRole("searchbox", { name: "Search projects" }).fill("");
    await expect.element(page.getByText(`${projects.length} projects`)).toBeVisible();
    await expect.element(page.getByRole("combobox", { name: "Sort by" })).toHaveTextContent("Last edited");
    await page.getByRole("button", { name: "Descending order" }).click();
    await expect.poll(rowNames).toEqual([notebooks.title, salt.title, cartographer.title, harbor.title]);
    expect(onSortChange).toHaveBeenLastCalledWith({ field: "editedAt", order: "ascending" });

    await page.getByRole("button", { name: "Ascending order" }).click();
    await expect.poll(rowNames).toEqual(projects.map(({ title }) => title));
  });

  it("leads the header with the search, then the sort's field and its order", async () => {
    await page.viewport(1280, 800);
    onTestFinished(() => page.viewport(414, 896));
    render(ProjectsScreen, { controller: projectsController() }, withLocale());

    await page.getByRole("searchbox", { name: "Search projects" }).click();
    await userEvent.tab();
    await expect.element(page.getByRole("combobox", { name: "Sort by" })).toHaveFocus();
    await userEvent.tab();
    await expect.element(page.getByRole("button", { name: "Descending order" })).toHaveFocus();
  });

  // A phone keeps the sort in the header, beside the title, as a wider screen does.
  it.each([
    [414, 896],
    [1280, 800],
  ])("sorts by another field from the header at %ipx", async (width, height) => {
    await page.viewport(width, height);
    onTestFinished(() => page.viewport(414, 896));
    render(ProjectsScreen, { controller: projectsController() }, withLocale());

    await page.getByRole("combobox", { name: "Sort by" }).click();
    await page.getByRole("option", { name: "Title" }).click();
    await expect.element(page.getByRole("option", { name: "Title" })).not.toBeInTheDocument();
    await expect.element(page.getByRole("combobox", { name: "Sort by" })).toHaveTextContent("Title");
    // A new field starts in its natural order, A to Z for the title.
    await expect.element(page.getByRole("button", { name: "Ascending order" })).toBeVisible();
    await expect.poll(rowNames).toEqual([notebooks.title, harbor.title, salt.title, cartographer.title]);
  });

  it("names the sort's field and order in the reader's language, and asks the controller for each choice", async () => {
    const spy = vi.fn();
    const sort = { field: "createdAt", order: "ascending" } as const;
    render(
      ProjectsScreen,
      { controller: fixedProjectsController({ model: ready, sort }, spy, { sortFieldOpen: true }) },
      withLocale("fr")
    );

    await expect.element(page.getByRole("combobox", { name: "Trier par" })).toHaveTextContent("Date de création");

    await page.getByRole("option", { name: "Titre" }).click();
    await page.getByRole("button", { name: "Ordre croissant" }).click();
    expect(spy).toHaveBeenCalledWith("sortField.select", "title");
    expect(spy).toHaveBeenCalledWith("flipOrder");
  });

  it("follows the query a navigation brings, and keeps the writer's own through a load that keeps the address", async () => {
    let url = $state(new URL("https://studio.test/projects?q=salt"));
    render(
      ProjectsScreen,
      { controller: projectsController({ getQuery: () => readProjectsQuery(url.searchParams) }) },
      withLocale()
    );
    const search = page.getByRole("searchbox", { name: "Search projects" });
    await expect.element(search).toHaveValue("salt");
    await expect.poll(rowNames).toEqual([salt.title]);

    await search.fill("heures");
    url = new URL("https://studio.test/projects?q=salt");
    flushSync();
    expect(rowNames()).toEqual([harbor.title]);

    url = new URL("https://studio.test/projects?q=carnets");
    await expect.element(search).toHaveValue("carnets");
    await expect.poll(rowNames).toEqual([notebooks.title]);
  });

  it("says no project matches the search", async () => {
    const controller = fixedProjectsController({ model: ready, query: "dragon", matched: 0, pages: [] });
    render(ProjectsScreen, { controller }, withLocale());

    await expect.element(page.getByRole("heading", { name: "No project matches your search", level: 2 })).toBeVisible();
    await expect.element(page.getByText("0 results")).toBeVisible();
    await expect.element(page.getByRole("article")).not.toBeInTheDocument();
  });

  it("says the projects are loading while the browser reads them for the first time", async () => {
    render(ProjectsScreen, { controller: fixedProjectsController({ model: { status: "loading" } }) }, withLocale("fr"));

    await expect.element(page.getByRole("heading", { name: "Chargement de vos projets", level: 2 })).toBeVisible();
    await expect.element(page.getByRole("button", { name: "Commencer à créer" })).not.toBeInTheDocument();
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

  it("starts the first project from the invitation", async () => {
    const spy = vi.fn();
    const empty: ProjectsModel = { status: "ready", now, projects: [] };
    render(ProjectsScreen, { controller: fixedProjectsController({ model: empty }, spy) }, withLocale("fr"));

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

  it("closes the dialog on cancel, though the click still reaches the dialog once its project is gone", async () => {
    // The real controller drops the project the moment it closes, which a fixed one never does.
    const controller = projectsController();
    const errors: unknown[] = [];
    const collect = (event: ErrorEvent) => errors.push(event.error);
    window.addEventListener("error", collect);
    onTestFinished(() => window.removeEventListener("error", collect));
    render(ProjectsScreen, { controller }, withLocale());

    controller.create();
    await page.getByRole("dialog", { name: "New project" }).getByRole("button", { name: "Cancel" }).click();

    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
    expect(errors).toEqual([]);
  });
});
