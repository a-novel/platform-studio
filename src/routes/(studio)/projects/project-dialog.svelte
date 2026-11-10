<!--
@component
Creates a project: its title, language, premise and tags, and its logo.
-->
<script lang="ts">
  import { localeNames } from "#lib/i18n/config.js";

  import type { LogoRefusal, ProjectEditor, ProjectsController, SaveFeedback } from "./controller.svelte";
  import LogoField from "./logo-field.svelte";

  import { getI18nContext } from "@a-novel-kit/nodelib-i18n/svelte";
  import {
    Alert,
    Button,
    Dialog,
    Field,
    Fieldset,
    InlineMessage,
    Input,
    Select,
    type SelectOption,
    Textarea,
  } from "@a-novel-kit/uikit";
  import { Language } from "@a-novel/service-narrative-engine-rest";

  let {
    controller,
    editor,
    genres,
  }: {
    controller: ProjectsController;
    editor: ProjectEditor;
    /** The names of the genres to offer, by the value a project stores. */
    genres: Record<string, string>;
  } = $props();
  const i18n = getI18nContext();
  const { t } = i18n;
  const formId = $props.id();

  const busy = $derived(editor.saving || editor.readingLogo);
  const genreChoices = $derived(Object.entries(genres).toSorted(([, a], [, b]) => a.localeCompare(b, i18n.language)));
  const issues = $derived(editor.failure?.status === "invalid" ? editor.failure.issues : []);
  const feedback = $derived(editor.failure?.status === "failed" ? editor.failure.feedback : null);

  const languages: SelectOption<Language>[] = [
    { value: Language.En, label: localeNames.en },
    { value: Language.Fr, label: localeNames.fr },
  ];

  function issue(field: "title" | "premise" | "language" | "genres" | "tags") {
    const found = issues.find((candidate) => candidate.field === field);
    if (!found) return undefined;
    if (field === "title")
      return found.code === "required" ? t("projects.dialog.titleRequired") : t("projects.dialog.titleTooLong");
    if (field === "premise") return t("projects.dialog.premiseTooLong");
    if (field === "genres") return t("projects.dialog.genresTooMany");
    if (field === "tags")
      return found.code === "tooMany" ? t("projects.dialog.tagsTooMany") : t("projects.dialog.tagsTooLong");
    return t("projects.dialog.languageRequired");
  }

  function feedbackMessage(value: SaveFeedback) {
    switch (value) {
      case "projectsFull":
        return t("projects.dialog.feedback.projectsFull");
      case "notFound":
        return t("projects.dialog.feedback.notFound");
      case "tooManyAttempts":
        return t("projects.dialog.feedback.tooManyAttempts");
      case "serviceUnavailable":
        return t("projects.dialog.feedback.serviceUnavailable");
    }
  }

  function refusalMessage(refusal: LogoRefusal | null) {
    switch (refusal) {
      case null:
        return undefined;
      case "unreadable":
        return t("projects.dialog.refusals.unreadable");
      case "format":
      case "dimensions":
        return t("projects.dialog.refusals.format");
      case "tooLarge":
        return t("projects.dialog.refusals.tooLarge");
    }
  }

  function submit(event: SubmitEvent & { currentTarget: HTMLFormElement }) {
    event.preventDefault();
    void controller.save(new FormData(event.currentTarget));
  }
</script>

<Dialog controller={controller.editorDialog} title={t("projects.dialog.createTitle")} closeOnBackdrop={!busy}>
  <form
    id="{formId}-form"
    class="project-form"
    method="POST"
    action="?/save"
    enctype="multipart/form-data"
    novalidate
    onsubmit={submit}
  >
    <Field label={t("projects.dialog.title")} error={issue("title")} required>
      {#snippet children(control)}
        <Input {...control} name="title" maxlength={80} autocomplete="off" />
      {/snippet}
    </Field>

    <Field label={t("projects.dialog.language")} hint={t("projects.dialog.languageHint")} error={issue("language")}>
      {#snippet children(control)}
        <Select {...control} name="language" options={languages} controller={controller.languageSelect} />
      {/snippet}
    </Field>

    <Field label={t("projects.dialog.premise")} hint={t("projects.dialog.premiseHint")} error={issue("premise")}>
      {#snippet children(control)}
        <Textarea {...control} name="premise" rows={4} autoSize />
      {/snippet}
    </Field>

    <Fieldset legend={t("projects.dialog.genres")} description={t("projects.dialog.genresHint")}>
      <div class="genres">
        {#each genreChoices as [genre, name] (genre)}
          <label class="genre">
            <input type="checkbox" name="genres" value={genre} />
            {name}
          </label>
        {/each}
      </div>
      {#if issue("genres")}
        <InlineMessage tone="error">{issue("genres")}</InlineMessage>
      {/if}
    </Fieldset>

    <Field label={t("projects.dialog.tags")} hint={t("projects.dialog.tagsHint")} error={issue("tags")}>
      {#snippet children(control)}
        <Input {...control} name="tags" autocomplete="off" />
      {/snippet}
    </Field>

    <LogoField
      error={refusalMessage(editor.logoRefusal)}
      draft={editor.logo}
      disabled={busy}
      onchoose={controller.chooseLogo}
      onremove={controller.removeLogo}
    />

    {#if feedback}
      <Alert tone="error">{feedbackMessage(feedback)}</Alert>
    {/if}
  </form>

  {#snippet actions()}
    <Button variant="text" tone="neutral" disabled={busy} onclick={controller.editorDialog.close}>
      {t("projects.dialog.cancel")}
    </Button>
    <Button type="submit" form="{formId}-form" disabled={busy}>
      {editor.saving ? t("projects.dialog.saving") : t("projects.dialog.create")}
    </Button>
  {/snippet}
</Dialog>

<style>
  .project-form {
    display: grid;
    gap: var(--space-4);
  }

  .genres {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1-5);
  }

  /* A real checkbox covers each choice, unseen, so the keyboard, the form and assistive technology need nothing else.
     A chosen genre takes the violet it shows with on its row. */
  .genre {
    display: inline-flex;
    position: relative;
    align-items: center;
    cursor: pointer;
    border-radius: var(--radius-sm);
    background: var(--color-control-surface);
    padding-inline: var(--space-2);
    min-block-size: var(--control-height-sm);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  .genre input {
    position: absolute;
    opacity: 0;
    cursor: inherit;
    margin: 0;
    inset: 0;
  }

  @media (hover: hover) {
    .genre:hover {
      background: var(--color-control-surface-hover);
    }
  }

  .genre:has(:checked) {
    background: var(--base-pressure);
    color: var(--color-text-inverse);
    font-weight: var(--font-weight-bold);
  }

  .genre:has(:focus-visible) {
    box-shadow: var(--shadow-focus-ring);
  }

  @media (forced-colors: active) {
    .genre:has(:checked) {
      outline: var(--border-width-strong) solid Highlight;
    }
  }
</style>
