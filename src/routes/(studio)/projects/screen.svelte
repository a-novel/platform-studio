<!--
@component
The writer's projects, most recently edited first, as rows of one, two or three columns. A writer without any is
invited to create the first one. The dialog creates a project.
-->
<script lang="ts">
  import type { ProjectsController } from "./controller.svelte";
  import { genreNames } from "./genres";
  import ProjectDialog from "./project-dialog.svelte";
  import ProjectRow from "./project-row.svelte";

  import { getI18nContext } from "@a-novel-kit/nodelib-i18n/svelte";
  import studioBanner from "@a-novel-kit/ui-images/files/banner/160h/studio-banner.png";
  import {
    Button,
    ButtonGroup,
    EmptyState,
    IconButton,
    Link,
    PageHeader,
    StatusState,
    StickyBar,
  } from "@a-novel-kit/uikit";

  import { Columns2, Columns3, Plus, Rows3 } from "@lucide/svelte";

  let { controller }: { controller: ProjectsController } = $props();
  const { t } = getI18nContext();
  const genres = $derived(genreNames(t));
  const model = $derived(controller.state.model);
  const listing = $derived(model?.status === "ready" && model.projects.length > 0 ? model : null);

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

{#if model}
  <div class="projects-screen" class:filled={listing !== null}>
    {#if listing}
      <StickyBar edge="start" bleed>
        <PageHeader title={t("projects.title")}>
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

      <div class="content">
        <ul class="rows" data-columns={controller.state.columns}>
          {#each listing.projects as project (project.id)}
            <li>
              <ProjectRow {project} now={listing.now} {genres} />
            </li>
          {/each}
        </ul>
      </div>

      <div class="phone-bar">
        <StickyBar edge="end" bleed>
          <div class="phone-action">{@render newProject(t("projects.new"))}</div>
        </StickyBar>
      </div>
    {:else}
      <PageHeader title={t("projects.title")} />

      <div class="state">
        {#if model.status === "ready"}
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
{/if}

{#if controller.state.editor}
  <ProjectDialog {controller} editor={controller.state.editor} {genres} />
{/if}

<style>
  /* The page fills the workspace below the shell's sticky bar, so a state without projects sits at its center. */
  .projects-screen {
    display: grid;
    grid-template-rows: auto 1fr;
    gap: var(--space-6);
    box-sizing: border-box;
    container: projects / inline-size;
    padding-inline: var(--layout-gutter);
    padding-block: var(--space-6) var(--space-12);
    min-block-size: calc(100dvb - var(--shell-sticky-top, 0px));
  }

  /* The bars reach the page's edges, so the spacing moves inside. */
  .filled {
    gap: 0;
    padding-block: 0;
  }

  /* The rows sit on the page itself and span its gutters, so their lines and backgrounds reach its edges. */
  .content {
    margin-inline: calc(-1 * var(--layout-gutter));
    padding-block-end: var(--space-12);
    min-inline-size: 0;
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

  /* Each row takes the height it needs, and the rows run down one column before the next. A row's end draws the line
     under it, and the column rule the line between columns. Native masonry (display: grid-lanes) would place the
     rows across the columns instead; as of November 2026 only Safari ships it. */
  .rows {
    column-gap: 0;
    column-rule: var(--border-width-thin) solid var(--color-border-divider);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .rows > li {
    break-inside: avoid;
    border-block-end: var(--border-width-thin) solid var(--color-border-divider);
  }

  .phone-bar {
    display: none;
  }

  /* The bar's button is a whole row, within the bar's own margins. */
  .phone-action {
    display: grid;
    padding-block: var(--space-3);
  }

  /* Columns stay at least 22rem wide, so a page too narrow for the choice does not offer it. */
  @container (min-width: 44rem) {
    .column-options {
      display: block;
    }

    .rows[data-columns="2"],
    .rows[data-columns="3"] {
      columns: 2;
    }
  }

  @container (min-width: 66rem) {
    .column-options :global(.columns-3) {
      display: inline-flex;
    }

    .rows[data-columns="3"] {
      columns: 3;
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
