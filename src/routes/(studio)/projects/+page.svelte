<script lang="ts">
  import { getProjectsSync } from "#lib/client/projects/sync.svelte.js";
  import PageTitle from "#lib/ui/PageTitle.svelte";
  import { deserialize } from "$app/forms";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";

  import { saveProjectColumns } from "./columns";
  import { type SaveResult, createProjectsController } from "./controller.svelte";
  import { genreFamilies, genreNames } from "./genres";
  import { projectsModel } from "./rows";
  import Screen from "./screen.svelte";
  import { readProjectsQuery, withProjectsQuery } from "./search";
  import { saveProjectSort } from "./sort";

  import { untrack } from "svelte";

  import { getI18nContext } from "@a-novel-kit/nodelib-i18n/svelte";
  import { ProtectedPage } from "@a-novel-kit/uikit";
  import { Language } from "@a-novel/service-narrative-engine-rest";

  let { data } = $props();
  const { t } = getI18nContext();
  const unavailable: SaveResult = { status: "failed", feedback: "serviceUnavailable" };
  const projects = getProjectsSync();
  const model = $derived(projectsModel(projects.state));
  // The search writes the address with shallow routing, which leaves `page.url` as the page loaded.
  const address = $derived(new URL((page.shallow?.url ?? page.url).href));

  const controller = createProjectsController({
    getModel: () => model,
    // A new project starts in the visitor's language, which changes only with a new page load.
    defaultLanguage: untrack(() => data.locale) === "fr" ? Language.Fr : Language.En,
    language: untrack(() => data.locale),
    genres: genreNames(genreFamilies(t)),
    retryHref: resolve("projects"),
    initialColumns: untrack(() => data.columns),
    onColumnsChange: saveProjectColumns,
    getQuery: () => readProjectsQuery(address.searchParams),
    onSearch: showQuery,
    initialSort: untrack(() => data.sort),
    onSortChange: saveProjectSort,
    submit,
  });

  /** Shows the query in the address, without loading the page or adding a history entry. */
  function showQuery(query: string) {
    // eslint-disable-next-line svelte/no-navigation-without-resolve -- Shallow routing edits the current, resolved URL.
    goto(withProjectsQuery(address, query), { shallow: true, replace: true, state: page.state });
  }

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

<ProtectedPage homeHref={resolve("projects")} retryHref={resolve("projects")}>
  <Screen {controller} />
</ProtectedPage>
