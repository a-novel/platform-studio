<script lang="ts">
  import AccessBoundary from "#lib/ui/AccessBoundary.svelte";
  import PageTitle from "#lib/ui/PageTitle.svelte";
  import { deserialize } from "$app/forms";
  import { invalidateAll } from "$app/navigation";
  import { resolve } from "$app/paths";

  import { saveProjectColumns } from "./columns";
  import { type ProjectRow, type SaveResult, createProjectsController } from "./controller.svelte";
  import { projectRow } from "./rows";
  import Screen from "./screen.svelte";

  import { onDestroy, untrack } from "svelte";

  import { getI18nContext } from "@a-novel-kit/nodelib-i18n/svelte";
  import { Language, ProjectPageSchema } from "@a-novel/service-narrative-engine-rest";

  let { data } = $props();
  const { t } = getI18nContext();
  const unavailable: SaveResult = { status: "failed", feedback: "serviceUnavailable" };
  // Leaving the page stops the pages still trying to load.
  const lifetime = new AbortController();
  onDestroy(() => lifetime.abort());

  const controller = createProjectsController({
    getModel: () => data.projects,
    // A new project starts in the visitor's language, which changes only with a new page load.
    defaultLanguage: untrack(() => data.locale) === "fr" ? Language.Fr : Language.En,
    retryHref: resolve("projects"),
    initialColumns: untrack(() => data.columns),
    onColumnsChange: saveProjectColumns,
    submit,
    fetchPage,
  });

  /** Fetches the projects after the first `offset`, trying again ever more slowly until it can. */
  async function fetchPage(offset: number): Promise<ProjectRow[]> {
    const url = `${resolve("projects")}/list?${new URLSearchParams({ offset: String(offset) })}`;
    for (let wait = 1000; ; wait = Math.min(wait * 2, 30_000)) {
      try {
        const response = await fetch(url, { signal: lifetime.signal, redirect: "manual" });
        // A session that ended since the page loaded signs in again, through the page's own load.
        if (response.type === "opaqueredirect") window.location.reload();
        if (response.ok) return ProjectPageSchema.parse(await response.json()).projects.map(projectRow);
        await response.body?.cancel();
      } catch {
        // A network failure tries again, unless the page is gone.
      }
      lifetime.signal.throwIfAborted();
      await new Promise((settle) => setTimeout(settle, wait));
    }
  }

  /** Posts the save action, and reloads the projects once one saved, even when a picture then failed. */
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

    if (save.status === "saved" || "projectID" in save) await invalidateAll();
    return save;
  }
</script>

<PageTitle title={t("pageTitles.projects")} />

<AccessBoundary homeHref={resolve("projects")} retryHref={resolve("projects")}>
  <Screen {controller} />
</AccessBoundary>
