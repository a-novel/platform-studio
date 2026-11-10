<script module lang="ts">
  import { createStorybookTranslator } from "#lib/i18n/storybook.js";

  import type { ProjectsModel } from "./controller.svelte";
  import { chosenLogo, fixedProjectsController, longest, newProjectEditor, now, projects } from "./projects.fixture";
  import ProjectsScreen from "./screen.svelte";

  import { reviewStoryGlobals } from "@a-novel-kit/uikit-storybook";

  import { defineMeta } from "@storybook/addon-svelte-csf";
  import type { StoryContext } from "@storybook/sveltekit";
  import { expect, fn, userEvent, within } from "storybook/test";

  const ready: ProjectsModel = { status: "ready", now, projects };
  const stress: ProjectsModel = { status: "ready", now, projects: [longest, ...projects] };
  const empty: ProjectsModel = { status: "ready", now, projects: [] };
  const createRequests = fn();

  const { Story } = defineMeta({
    title: "Projects/Screen",
    component: ProjectsScreen,
    parameters: {
      layout: "fullscreen",
      docs: {
        description: {
          component:
            "The writer's projects, most recently edited first. A writer without any is invited to create the first one; the dialog creates a project, with its logo.",
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
    controller: fixedProjectsController({ model: ready, editor: newProjectEditor({ logo: chosenLogo }) }),
  }}
  globals={reviewStoryGlobals.desktop}
/>

<Story
  name="New project, mobile"
  exportName="NewProjectMobile"
  args={{
    controller: fixedProjectsController({ model: ready, editor: newProjectEditor({ logo: chosenLogo }) }),
  }}
  globals={reviewStoryGlobals.mobile}
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
