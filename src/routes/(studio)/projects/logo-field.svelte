<!--
@component
The project's logo in its dialog: the logo chosen, above one field that names the file it came from and holds a cross
that removes it.
-->
<script lang="ts">
  import type { LogoDraft } from "./controller.svelte";

  import { getI18nContext } from "@a-novel-kit/nodelib-i18n/svelte";
  import { Field, FileInput, type FileInputController } from "@a-novel-kit/uikit";

  let {
    error,
    draft,
    disabled,
    onchoose,
    onremove,
  }: {
    /** Why the last logo was refused, shown until another is chosen. */
    error?: string;
    draft: LogoDraft;
    disabled: boolean;
    onchoose: (file: File) => void;
    onremove: () => void;
  } = $props();
  const { t } = getI18nContext();
  const chosen = $derived(draft.status === "chosen" ? draft : undefined);

  // The field names the file the draft holds, since the input empties itself after each choice.
  const files: FileInputController = {
    get state() {
      return { value: chosen ? [chosen.file.name] : [] };
    },
    setValue: () => {},
  };

  function choose(event: Event & { currentTarget: HTMLInputElement }) {
    const file = event.currentTarget.files?.[0];
    // The same file chosen again after a refusal still reports a change.
    event.currentTarget.value = "";
    if (file) onchoose(file);
  }
</script>

<Field label={t("projects.dialog.logo.label")} hint={t("projects.dialog.logo.hint")} {error}>
  {#snippet children(control)}
    <div class="logo">
      {#if chosen}<img class="preview" src={chosen.src} alt="" />{/if}
      <FileInput
        {...control}
        accept="image/*"
        {disabled}
        controller={files}
        onchange={choose}
        onclear={chosen ? onremove : undefined}
      />
    </div>
  {/snippet}
</Field>

<style>
  .logo {
    display: grid;
    gap: var(--space-2);
  }

  /* The logo as a row draws it: at a row's logo height, in its own proportions. */
  .preview {
    display: block;
    border-radius: var(--radius-md);
    max-inline-size: 100%;
    block-size: var(--space-16);
    object-fit: contain;
    object-position: left;
  }
</style>
