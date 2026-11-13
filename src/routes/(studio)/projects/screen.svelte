<!--
@component
The writer's projects, most recently edited first, as rows of one, two or three columns, with how many they hold. The
next page shows as the writer nears the end of the list. A writer without any is invited to create the first one. The
dialog creates a project. A browser without JavaScript is told the list needs it.
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
    Link,
    PageHeader,
    Spinner,
    StatusState,
    StickyBar,
  } from "@a-novel-kit/uikit";

  import { Columns2, Columns3, Plus, Rows3 } from "@lucide/svelte";

  let { controller }: { controller: ProjectsController } = $props();
  const { t } = getI18nContext();
  const families = $derived(genreFamilies(t));
  const genres = $derived(genreNames(families));
  const model = $derived(controller.state.model);
  const listing = $derived(model.status === "ready" && model.projects.length > 0 ? model : null);
  const shown = $derived(controller.state.pages.reduce((sum, page) => sum + page.length, 0));

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
</script>

{#snippet newProject(label: string)}
  <Button onclick={controller.create}>
    <Plus size="var(--icon-size-sm)" />
    {label}
  </Button>
{/snippet}

<div class="projects-screen" class:filled={listing !== null}>
  {#if listing}
    <StickyBar edge="start" bleed>
      <PageHeader
        title={t("projects.title")}
        description={t("projects.count", { loaded: shown, count: listing.projects.length })}
      >
        {#snippet actions()}
          <div class="header-actions">
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
        {/snippet}
      </PageHeader>
    </StickyBar>

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

    <div class="phone-bar">
      <StickyBar edge="end" bleed>
        <div class="phone-actions">
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
     header brings its own space above it, so the title starts as high as it does over a list of projects. */
  .projects-screen {
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
    --card-max: calc(var(--layout-readable-measure-long) + 2 * var(--space-4));
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

  .header-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-4);
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

  /* The bar centers its actions under the thumb, each an icon, so more fit beside them. */
  .phone-actions {
    display: flex;
    justify-content: center;
    gap: var(--space-2);
    padding-block: var(--space-3);
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

  @container (min-width: 66rem) {
    .column-options :global(.columns-3) {
      display: inline-flex;
    }

    .content[data-columns="3"] {
      --columns: 3;
    }
  }

  /* On a phone the creation waits under the thumb, and the page ends on its bar. */
  @container (max-width: 34rem) {
    .header-actions {
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
