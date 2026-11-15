<script module lang="ts">
  import { createStorybookTranslator } from "#lib/i18n/storybook.js";

  import { PROJECTS_PAGE, type ProjectsControllerState, type ProjectsModel } from "./controller.svelte";
  import {
    cartographer,
    chosenLogo,
    fixedProjectsController,
    harbor,
    longest,
    manyProjects,
    newProjectEditor,
    notebooks,
    now,
    projects,
    salt,
  } from "./projects.fixture";
  import ProjectsScreen from "./screen.svelte";

  import { reviewStoryGlobals } from "@a-novel-kit/uikit-storybook";

  import { defineMeta } from "@storybook/addon-svelte-csf";
  import type { StoryContext } from "@storybook/sveltekit";
  import { expect, fn, userEvent, within } from "storybook/test";

  const ready: ProjectsModel = { status: "ready", now, projects };
  const stress: ProjectsModel = { status: "ready", now, projects: [longest, ...projects] };
  const empty: ProjectsModel = { status: "ready", now, projects: [] };
  const many = manyProjects(41);
  const firstPage: ProjectsModel = { status: "ready", now, projects: many };
  const filledDialog = { genres: ["mystery", "historical", "drama"], tags: ["roman-maritime", "années-50"] };
  const searchResults = { model: ready, query: "car", matched: 2, pages: [[cartographer, notebooks]] };
  const noSearchResult = { model: ready, query: "dragon", matched: 0, pages: [] };
  const byTitle: Partial<ProjectsControllerState> = {
    model: ready,
    sort: { field: "title", order: "ascending" },
    pages: [[notebooks, harbor, salt, cartographer]],
  };
  const createRequests = fn();

  const { Story } = defineMeta({
    title: "Projects/Screen",
    component: ProjectsScreen,
    parameters: {
      layout: "fullscreen",
      docs: {
        description: {
          component:
            "The writer's projects, the last edited first unless the writer sorts them otherwise, and a search that keeps those that match. A writer without any is invited to create the first one; the dialog creates a project, with its logo.",
        },
      },
    },
  });

  async function verifyCreate({ canvasElement, globals }: Pick<StoryContext, "canvasElement" | "globals">) {
    const canvas = within(canvasElement);
    const t = createStorybookTranslator(globals);
    await userEvent.click(canvas.getByRole("button", { name: t("projects.empty.action") }));
    await expect(createRequests).toHaveBeenCalledWith("create");
  }
</script>

<Story
  name="Projects, desktop"
  exportName="ProjectsDesktop"
  args={{ controller: fixedProjectsController({ model: ready }) }}
  globals={reviewStoryGlobals.desktop}
/>

<Story
  name="Projects, mobile"
  exportName="ProjectsMobile"
  args={{ controller: fixedProjectsController({ model: ready }) }}
  globals={reviewStoryGlobals.mobile}
/>

<Story
  name="Projects, two columns"
  exportName="ProjectsTwoColumns"
  args={{ controller: fixedProjectsController({ model: ready, columns: 2 }) }}
  globals={reviewStoryGlobals.desktop}
/>

<Story
  name="Projects, three columns"
  exportName="ProjectsThreeColumns"
  args={{ controller: fixedProjectsController({ model: ready, columns: 3 }) }}
  globals={reviewStoryGlobals.desktop}
/>

<Story
  name="Longest values, desktop"
  exportName="LongestDesktop"
  args={{ controller: fixedProjectsController({ model: stress }) }}
  globals={reviewStoryGlobals.desktop}
/>

<Story
  name="Longest values, three columns"
  exportName="LongestThreeColumns"
  args={{ controller: fixedProjectsController({ model: stress, columns: 3 }) }}
  globals={reviewStoryGlobals.desktop}
/>

<Story
  name="Longest values, mobile"
  exportName="LongestMobile"
  args={{ controller: fixedProjectsController({ model: stress }) }}
  globals={reviewStoryGlobals.mobile}
/>

<Story
  name="Projects, French"
  exportName="ProjectsFrench"
  args={{ controller: fixedProjectsController({ model: ready }) }}
  globals={{ ...reviewStoryGlobals.desktop, locale: "fr" }}
/>

<Story
  name="Search results"
  exportName="SearchResults"
  args={{ controller: fixedProjectsController(searchResults) }}
  globals={reviewStoryGlobals.desktop}
/>

<Story
  name="Search results, mobile"
  exportName="SearchResultsMobile"
  args={{ controller: fixedProjectsController(searchResults) }}
  globals={reviewStoryGlobals.mobile}
/>

<Story
  name="No search result"
  exportName="NoSearchResult"
  args={{ controller: fixedProjectsController(noSearchResult) }}
  globals={reviewStoryGlobals.desktop}
/>

<Story
  name="No search result, mobile"
  exportName="NoSearchResultMobile"
  args={{ controller: fixedProjectsController(noSearchResult) }}
  globals={reviewStoryGlobals.mobile}
/>

<Story
  name="Sorted by title"
  exportName="SortedByTitle"
  args={{ controller: fixedProjectsController(byTitle) }}
  globals={reviewStoryGlobals.desktop}
/>

<Story
  name="Choosing the sort"
  exportName="ChoosingTheSort"
  args={{ controller: fixedProjectsController({ model: ready }, undefined, { sortOpen: "header" }) }}
  globals={reviewStoryGlobals.desktop}
/>

<Story
  name="Choosing the sort, mobile"
  exportName="ChoosingTheSortMobile"
  args={{ controller: fixedProjectsController({ model: ready }, undefined, { sortOpen: "phone" }) }}
  globals={reviewStoryGlobals.mobile}
/>

<Story
  name="Choosing the sort's field"
  exportName="ChoosingTheSortField"
  args={{
    controller: fixedProjectsController({ model: ready }, undefined, { sortOpen: "header", sortFieldOpen: true }),
  }}
  globals={reviewStoryGlobals.desktop}
/>

<Story
  name="Choosing the sort's field, mobile"
  exportName="ChoosingTheSortFieldMobile"
  args={{
    controller: fixedProjectsController({ model: ready }, undefined, { sortOpen: "phone", sortFieldOpen: true }),
  }}
  globals={reviewStoryGlobals.mobile}
/>

<Story
  name="First project, desktop"
  exportName="EmptyDesktop"
  args={{ controller: fixedProjectsController({ model: empty }, createRequests) }}
  globals={reviewStoryGlobals.desktop}
  play={verifyCreate}
/>

<Story
  name="First project, mobile"
  exportName="EmptyMobile"
  args={{ controller: fixedProjectsController({ model: empty }) }}
  globals={reviewStoryGlobals.mobile}
/>

<Story
  name="Starting"
  args={{ controller: fixedProjectsController({ model: { status: "starting" } }) }}
  parameters={{
    docs: {
      description: {
        story:
          "The page before it runs in the browser. Only a browser without JavaScript shows its notice, which says the list needs it.",
      },
    },
  }}
/>

<Story name="Loading" args={{ controller: fixedProjectsController({ model: { status: "loading" } }) }} />

<Story name="Unavailable" args={{ controller: fixedProjectsController({ model: { status: "unavailable" } }) }} />

<Story
  name="Rate limited"
  exportName="RateLimited"
  args={{ controller: fixedProjectsController({ model: { status: "rate-limited" } }) }}
/>

<Story
  name="New project"
  exportName="NewProject"
  args={{ controller: fixedProjectsController({ model: ready, editor: newProjectEditor() }) }}
  globals={reviewStoryGlobals.desktop}
/>

<Story
  name="New project, with its logo"
  exportName="NewProjectLogo"
  args={{
    controller: fixedProjectsController(
      { model: ready, editor: newProjectEditor({ logo: chosenLogo }) },
      undefined,
      filledDialog
    ),
  }}
  globals={reviewStoryGlobals.desktop}
/>

<Story
  name="New project, searching genres"
  exportName="NewProjectGenreSearch"
  args={{
    controller: fixedProjectsController({ model: ready, editor: newProjectEditor() }, undefined, {
      ...filledDialog,
      genreQuery: "punk",
    }),
  }}
  globals={reviewStoryGlobals.desktop}
/>

<Story
  name="New project, mobile"
  exportName="NewProjectMobile"
  args={{
    controller: fixedProjectsController(
      { model: ready, editor: newProjectEditor({ logo: chosenLogo }) },
      undefined,
      filledDialog
    ),
  }}
  globals={reviewStoryGlobals.mobile}
/>

<Story
  name="New project, choosing its language"
  exportName="NewProjectLanguage"
  args={{
    controller: fixedProjectsController({ model: ready, editor: newProjectEditor() }, undefined, {
      languageOpen: true,
    }),
  }}
  globals={reviewStoryGlobals.desktop}
/>

<Story
  name="More projects below"
  exportName="MoreBelow"
  args={{
    controller: fixedProjectsController({
      model: firstPage,
      columns: 2,
      pages: [many.slice(0, PROJECTS_PAGE)],
      more: true,
    }),
  }}
  globals={reviewStoryGlobals.desktop}
/>

<Story
  name="Refusals"
  args={{
    controller: fixedProjectsController({
      model: ready,
      editor: newProjectEditor({
        failure: {
          status: "invalid",
          issues: [
            { field: "title", code: "required" },
            { field: "premise", code: "tooLong" },
          ],
        },
        logoRefusal: "unreadable",
      }),
    }),
  }}
/>

<Story
  name="Service failure"
  exportName="ServiceFailure"
  args={{
    controller: fixedProjectsController({
      model: ready,
      editor: newProjectEditor({ failure: { status: "failed", feedback: "serviceUnavailable" } }),
    }),
  }}
/>

<Story
  name="Saving"
  args={{ controller: fixedProjectsController({ model: ready, editor: newProjectEditor({ saving: true }) }) }}
/>
