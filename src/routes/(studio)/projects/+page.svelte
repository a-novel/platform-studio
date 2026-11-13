<script lang="ts">
  import { getProjectsSync } from "#lib/client/projects/sync.svelte.js";
  import AccessBoundary from "#lib/ui/AccessBoundary.svelte";
  import PageTitle from "#lib/ui/PageTitle.svelte";
  import { deserialize } from "$app/forms";
  import { resolve } from "$app/paths";

  import { saveProjectColumns } from "./columns";
  import { type SaveResult, createProjectsController } from "./controller.svelte";
  import { projectsModel } from "./rows";
  import Screen from "./screen.svelte";

  import { untrack } from "svelte";

  import { getI18nContext } from "@a-novel-kit/nodelib-i18n/svelte";
  import { Language } from "@a-novel/service-narrative-engine-rest";

  let { data } = $props();
  const { t } = getI18nContext();
  const unavailable: SaveResult = { status: "failed", feedback: "serviceUnavailable" };
  const projects = getProjectsSync();
  const model = $derived(projectsModel(projects.state));

  const controller = createProjectsController({
    getModel: () => model,
    // A new project starts in the visitor's language, which changes only with a new page load.
    defaultLanguage: untrack(() => data.locale) === "fr" ? Language.Fr : Language.En,
    retryHref: resolve("projects"),
    initialColumns: untrack(() => data.columns),
    onColumnsChange: saveProjectColumns,
    submit,
  });

  /** Posts the save action, and writes the project it saved to the browser database, even when its logo then failed. */
  async function submit(form: FormData): Promise<SaveResult> {
    const response = await fetch(resolve("projects") + "?/save", {
      method: "POST",
      headers: { accept: "application/json", "x-sveltekit-action": "true" },
      body: form,
    });
    const result = deserialize(await response.text());

    // A session that ended since the page loaded signs in again through the account platform.
    if (result.type === "redirect") {
      window.location.assign(result.location);
      return unavailable;
    }
    const save = result.type === "error" ? undefined : (result.data?.save as SaveResult | undefined);
    if (!save) return unavailable;

    if ("project" in save && save.project) await projects.save(save.project);
    return save;
  }
</script>

<PageTitle title={t("pageTitles.projects")} />

<AccessBoundary homeHref={resolve("projects")} retryHref={resolve("projects")}>
  <Screen {controller} />
</AccessBoundary>
