<!--
@component
The writer's projects, as rows of one, two or three columns, with how many they hold. A sort in the header orders them.
A search keeps those that match, in the header on a wide screen and in the bar under the thumb on a phone. The next page
shows as the writer nears the end of the list. A writer without any is invited to create the first one. The dialog
creates a project. A browser without JavaScript is told the list needs it.
-->
<script lang="ts">
  import type { ProjectsController } from "./controller.svelte";
  import { genreFamilies, genreNames } from "./genres";
  import ProjectDialog from "./project-dialog.svelte";
  import ProjectRow from "./project-row.svelte";

  import { getI18nContext } from "@a-novel-kit/nodelib-i18n/svelte";
  import studioBanner from "@a-novel-kit/ui-images/files/banner/160h/studio-banner.png";
  import {
    Button,
    ButtonGroup,
    Card,
    EmptyState,
    IconButton,
    Input,
    Link,
    PageHeader,
    Select,
    Spinner,
    StatusState,
    StickyBar,
  } from "@a-novel-kit/uikit";

  import { ArrowDown, ArrowUp, Columns2, Columns3, Plus, Rows3, Search } from "@lucide/svelte";

  let { controller }: { controller: ProjectsController } = $props();
  const { t } = getI18nContext();
  const families = $derived(genreFamilies(t));
  const genres = $derived(genreNames(families));
  const model = $derived(controller.state.model);
  const listing = $derived(model.status === "ready" && model.projects.length > 0 ? model : null);
  const searching = $derived(controller.state.query.trim() !== "");

  // The next page shows while the end of the list is half a screen away. Each page brings a new loader, which the
  // observer reports at once, so a screen tall enough for several pages fills up.
  function watchEnd(element: HTMLElement) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) controller.loadMore();
      },
      { rootMargin: "0px 0px 50% 0px" }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }

  const columnOptions = $derived([
    { columns: 1, label: t("projects.columns.one"), Icon: Rows3 },
    { columns: 2, label: t("projects.columns.two"), Icon: Columns2 },
    { columns: 3, label: t("projects.columns.three"), Icon: Columns3 },
  ] as const);

  const fieldOptions = $derived([
    { value: "editedAt", label: t("projects.sort.editedAt") },
    { value: "createdAt", label: t("projects.sort.createdAt") },
    { value: "title", label: t("projects.sort.title") },
  ] as const);

  // An arrow draws the order: down for descending.
  const ascending = $derived(controller.state.sort.order === "ascending");
  const OrderIcon = $derived(ascending ? ArrowUp : ArrowDown);
</script>

{#snippet newProject(label: string)}
  <Button onclick={controller.create}>
    <Plus size="var(--icon-size-sm)" />
    {label}
  </Button>
{/snippet}

{#snippet searchField()}
  <search class="search">
    <Input
      type="search"
      aria-label={t("projects.search.label")}
      placeholder={t("projects.search.placeholder")}
      value={controller.state.query}
      oninput={(event) => controller.search(event.currentTarget.value)}
    >
      {#snippet startAdornment()}<Search size="var(--icon-size-sm)" />{/snippet}
    </Input>
  </search>
{/snippet}

<div class="projects-screen" class:filled={listing !== null}>
  {#if listing}
    <StickyBar edge="start" bleed>
      <div class="header">
        <PageHeader
          class="heading"
          title={t("projects.title")}
          description={searching
            ? t("projects.results", { count: controller.state.matched })
            : t("projects.count", { count: controller.state.matched })}
        />
        <div class="finder">
          <div class="sort">
            <div class="sort-field">
              <Select aria-label={t("projects.sort.by")} options={fieldOptions} controller={controller.sortField} />
            </div>
            <IconButton
              label={ascending ? t("projects.sort.ascending") : t("projects.sort.descending")}
              variant="outline"
              tone="neutral"
              onclick={controller.flipOrder}
            >
              <OrderIcon size="var(--icon-size-sm)" />
            </IconButton>
          </div>
          {@render searchField()}
        </div>
        <div class="tools">
          <div class="column-options">
            <ButtonGroup label={t("projects.columns.label")}>
              {#each columnOptions as { columns, label, Icon } (columns)}
                <IconButton
                  class="columns-{columns}"
                  {label}
                  variant="ghost"
                  tone="neutral"
                  aria-pressed={controller.state.columns === columns}
                  onclick={() => controller.setColumns(columns)}
                >
                  <Icon size="var(--icon-size-sm)" />
                </IconButton>
              {/each}
            </ButtonGroup>
          </div>
          {@render newProject(t("projects.new"))}
        </div>
      </div>
    </StickyBar>

    {#if controller.state.matched === 0}
      <div class="state">
        <StatusState tone="info" title={t("projects.search.noMatch")} headingLevel={2} />
      </div>
    {:else}
      <div class="content" data-columns={controller.state.columns}>
        <!-- Each page lays its own columns out, so the rows a page adds never move the ones above. -->
        {#each controller.state.pages as page, index (index)}
          <ul class="rows">
            {#each page as project (project.id)}
              <li>
                <Card surface="ghost" class="project-card">
                  <ProjectRow {project} now={listing.now} {genres} />
                </Card>
              </li>
            {/each}
          </ul>
        {/each}
        {#if controller.state.more}
          {#key controller.state.pages.length}
            <div class="loader" {@attach watchEnd}>
              <Spinner label={t("projects.loadingMore")} />
            </div>
          {/key}
        {/if}
      </div>
    {/if}

    <div class="phone-bar">
      <StickyBar edge="end" bleed>
        <div class="phone-actions">
          {@render searchField()}
          <IconButton label={t("projects.new")} onclick={controller.create}>
            <Plus size="var(--icon-size-sm)" />
          </IconButton>
        </div>
      </StickyBar>
    </div>
  {:else}
    <PageHeader title={t("projects.title")} />

    <div class="state">
      {#if model.status === "starting"}
        <noscript>
          <StatusState
            tone="warning"
            title={t("projects.noScript.title")}
            description={t("projects.noScript.description")}
            headingLevel={2}
          />
        </noscript>
      {:else if model.status === "loading"}
        <StatusState tone="loading" title={t("projects.loading")} headingLevel={2} />
      {:else if model.status === "ready"}
        <EmptyState title={t("projects.empty.title")} description={t("projects.empty.description")}>
          {#snippet illustration()}
            <img class="illustration" src={studioBanner} width="269" height="64" alt="" />
          {/snippet}
          {#snippet actions()}{@render newProject(t("projects.empty.action"))}{/snippet}
        </EmptyState>
      {:else}
        <StatusState
          tone={model.status === "rate-limited" ? "warning" : "error"}
          title={t("projects.unavailable.title")}
          description={model.status === "rate-limited"
            ? t("projects.unavailable.rateLimited")
            : t("projects.unavailable.description")}
          headingLevel={2}
        >
          {#snippet actions()}
            <Link href={controller.state.retryHref} data-sveltekit-reload>{t("access.retry")}</Link>
          {/snippet}
        </StatusState>
      {/if}
    </div>
  {/if}
</div>

{#if controller.state.editor}
  <ProjectDialog {controller} editor={controller.state.editor} {families} />
{/if}

<style>
  /* The page fills the workspace below the shell's sticky bar, so a state without projects sits at its center. The
     header brings its own space above it, so the title starts as high as it does over a list of projects. A card
     holds its premise at the long readable measure, plus its padding, and the list's columns measure from it. */
  .projects-screen {
    --card-max: calc(var(--layout-readable-measure-long) + 2 * var(--space-4));
    display: grid;
    grid-template-rows: auto 1fr;
    gap: var(--space-6);
    box-sizing: border-box;
    container: projects / inline-size;
    padding-inline: var(--layout-gutter);
    padding-block: 0 var(--space-12);
    min-block-size: calc(100dvb - var(--shell-sticky-top, 0px));
  }

  /* The bars reach the page's edges, so the spacing moves inside. */
  .filled {
    gap: 0;
    padding-block: 0;
  }

  /* A card holds its premise at the long readable measure, plus the card's padding, so a wide screen
     stops the columns there, centered, instead of stretching each card across it. */
  .content {
    --columns: 1;
    justify-self: center;
    box-sizing: border-box;
    padding-block: var(--space-4) var(--space-12);
    inline-size: 100%;
    min-inline-size: 0;
    max-inline-size: calc(var(--columns) * var(--card-max) + (var(--columns) - 1) * var(--space-4));
  }

  .state {
    display: grid;
    place-items: center;
    block-size: 100%;
  }

  /* The banner keeps its proportions in a column narrower than it. */
  .illustration {
    max-inline-size: 100%;
    block-size: auto;
  }

  /* The title, the finder and the tools share a row that wraps, the controls level with the count under the title.
     The header spaces the title as it spaces the rest. */
  .header {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: var(--space-6);
    padding-block: var(--space-4);
  }

  .header :global(.heading) {
    padding-block: 0;
  }

  /* The finder takes the room the title leaves, and its search grows into it. */
  .finder {
    display: flex;
    flex: 1 1 auto;
    justify-content: flex-end;
    gap: var(--space-4);
  }

  .tools {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    margin-inline-start: auto;
  }

  .sort {
    display: flex;
    gap: var(--space-2);
  }

  /* The field keeps one width whichever it names, so choosing another moves nothing beside it. The width holds the
     longest name on one line: French's "Dernière modification". */
  .sort-field {
    inline-size: calc(var(--layout-sidebar-min) * var(--ratio-density));
  }

  /* The header's search starts compact, so the finder fits beside the title, then grows into the free room up to a
     form's width. */
  .finder .search {
    flex: 1 1 var(--layout-sidebar-min);
    min-inline-size: var(--layout-sidebar-min);
    max-inline-size: var(--layout-container-sm);
  }

  .column-options {
    display: none;
  }

  .column-options :global(.columns-3) {
    display: none;
  }

  /* A mosaic: each card takes the height it needs, and the cards run down one column before the next, never
     aligned across columns. A card's padding below it spaces it from the next, since a column break truncates
     margins. Native masonry (display: grid-lanes) would place the cards across the columns instead; as of
     November 2026 only Safari ships it. */
  .rows {
    column-gap: var(--space-4);
    columns: var(--columns);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .rows > li {
    break-inside: avoid;
    padding-block-end: var(--space-4);
  }

  /* A card will open its project, so it already shows the pointer a link takes. */
  .rows :global(.project-card) {
    cursor: pointer;
  }

  .loader {
    display: grid;
    place-items: center;
    padding-block: var(--space-6);
  }

  .phone-bar {
    display: none;
  }

  /* Under the thumb, the search takes the room the creation's icon leaves. */
  .phone-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding-block: var(--space-3);
  }

  .phone-actions .search {
    flex: 1;
  }

  /* Columns stay at least 22rem wide, so a page too narrow for the choice does not offer it. */
  @container (min-width: 44rem) {
    .column-options {
      display: block;
    }

    .content[data-columns="2"],
    .content[data-columns="3"] {
      --columns: 2;
    }
  }

  /* Once the row holds them all, the finder takes a card's width, centered, so it lines up with a single column of
     cards and sits centered over several. Short of the room to center it, it narrows between the title and the
     tools. */
  @container (min-width: 52rem) {
    .header {
      display: grid;
      grid-template-columns: minmax(max-content, 1fr) minmax(0, var(--card-max)) minmax(max-content, 1fr);
    }

    .finder .search {
      max-inline-size: none;
    }
  }

  @container (min-width: 66rem) {
    .column-options :global(.columns-3) {
      display: inline-flex;
    }

    .content[data-columns="3"] {
      --columns: 3;
    }
  }

  /* On a phone the header keeps the sort, the search and the creation wait under the thumb, and the page ends on its
     bar. */
  @container (max-width: 34rem) {
    .finder .search,
    .tools {
      display: none;
    }

    .phone-bar {
      display: contents;
    }

    .content {
      padding-block-end: 0;
    }
  }
</style>
