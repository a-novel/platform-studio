<!--
@component
One of the writer's projects as a row: its logo or else its title, its premise, its genres and tags, then discreetly
when it was edited and created, and in what language.
-->
<script lang="ts">
  import { localeNames } from "#lib/i18n/config.js";

  import type { ProjectRow } from "./controller.svelte";
  import { timeAgo } from "./dates";

  import { getI18nContext } from "@a-novel-kit/nodelib-i18n/svelte";
  import { Badge, Flag } from "@a-novel-kit/uikit";

  let {
    project,
    now,
    genres,
  }: {
    project: ProjectRow;
    now: Date;
    /** The names of the genres the dialog offers, by the value a project stores. */
    genres: Record<string, string>;
  } = $props();
  const i18n = getI18nContext();
  const { t } = i18n;

  /** Lets the keyboard reach a premise that scrolls: taller than its six lines, away from a phone. */
  function focusableWhenScrolling(element: HTMLElement) {
    const update = () => {
      if (getComputedStyle(element).overflowY === "auto" && element.scrollHeight > element.clientHeight)
        element.tabIndex = 0;
      else element.removeAttribute("tabindex");
    };
    update();

    const observer = new ResizeObserver(update);
    observer.observe(element);

    return () => observer.disconnect();
  }
</script>

<article class="project" aria-labelledby="project-{project.id}">
  <h2 id="project-{project.id}" class="title">
    {#if project.logo}
      <img src={project.logo} height="64" alt={project.title} loading="lazy" decoding="async" />
    {:else}
      <span class="title-text">{project.title}</span>
    {/if}
  </h2>

  {#if project.premise}
    <p class="premise" {@attach focusableWhenScrolling}>{project.premise}</p>
  {/if}

  {#if project.genres.length > 0}
    <ul class="labels genres">
      {#each project.genres as genre (genre)}
        <li><Badge class="genre">{genres[genre] ?? genre}</Badge></li>
      {/each}
    </ul>
  {/if}

  {#if project.tags.length > 0}
    <ul class="labels">
      {#each project.tags as tag (tag)}
        <li><Badge tone="brand">{tag}</Badge></li>
      {/each}
    </ul>
  {/if}

  <p class="facts">
    <span class="dates">
      <time datetime={project.editedAt.toISOString()}>
        {t("projects.row.edited", { when: timeAgo(project.editedAt, now, i18n.language) })}
      </time>
      <time datetime={project.createdAt.toISOString()}>
        {t("projects.row.created", { when: timeAgo(project.createdAt, now, i18n.language) })}
      </time>
    </span>
    <Flag locale={project.language} label={localeNames[project.language]} />
  </p>
</article>

<style>
  /* The row's text lines up with the page's own, across the gutter the row spans. In rows of the same height, the
     last line stays at the bottom. */
  .project {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding-inline: var(--layout-gutter);
    padding-block: var(--space-4);
  }

  h2,
  p,
  ul {
    margin: 0;
  }

  .title {
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-lg);
    line-height: var(--line-height-compact);
  }

  /* The narrative engine caps a title to fit these three lines at every width. */
  .title-text {
    display: -webkit-box;
    overflow: hidden;
    overflow-wrap: anywhere;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    line-clamp: 3;
  }

  /* A logo has its own proportions, drawn at a fixed height unless the row is narrower than it. */
  .title img {
    display: block;
    border-radius: var(--radius-md);
    max-inline-size: 100%;
    block-size: var(--space-16);
    object-fit: contain;
    object-position: left;
  }

  /* Six lines, and the rest a scroll away. */
  .premise {
    max-inline-size: var(--layout-readable-measure);
    max-block-size: 6lh;
    overflow-y: auto;
    scrollbar-width: thin;
    color: var(--color-text-muted);
    white-space: pre-line;
    overflow-wrap: anywhere;
  }

  .labels {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
    padding: 0;
    list-style: none;
  }

  /* Genres take Studio's own violet, which no badge tone carries. */
  .genres :global(.genre) {
    --badge-accent: var(--color-lamp-violet);
  }

  /* The dates at the start of the row's last line, and the language at its end. */
  .facts {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-3);
    margin-block-start: auto;
    padding-block-start: var(--space-1);
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
  }

  .dates {
    display: flex;
    flex-wrap: wrap;
    gap: 0 var(--space-3);
  }

  /* On a phone a second scroll area would fight the page's, so the premise stops at five lines; the dates stack to
     leave the row more room. */
  @container projects (max-width: 34rem) {
    .premise {
      display: -webkit-box;
      max-block-size: none;
      overflow: hidden;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 5;
      line-clamp: 5;
    }

    .dates {
      flex-direction: column;
    }
  }
</style>
