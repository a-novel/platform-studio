<!--
@component
The project's logo in its dialog: what the project will show, a file input for an image, and a button that
removes it.
-->
<script lang="ts">
  import type { LogoDraft } from "./controller.svelte";

  import { getI18nContext } from "@a-novel-kit/nodelib-i18n/svelte";
  import { Button, Field, FileInput } from "@a-novel-kit/uikit";

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
  const src = $derived(draft.status === "chosen" ? draft.src : undefined);

  function choose(event: Event & { currentTarget: HTMLInputElement }) {
    const file = event.currentTarget.files?.[0];
    // The same file chosen again after a refusal still reports a change.
    event.currentTarget.value = "";
    if (file) onchoose(file);
  }
</script>

<div class="logo-field">
  <div class="preview">
    {#if src}<img {src} alt="" />{/if}
  </div>

  <div class="controls">
    <Field label={t("projects.dialog.logo.label")} hint={t("projects.dialog.logo.hint")} {error}>
      {#snippet children(control)}
        <FileInput {...control} accept="image/*" {disabled} onchange={choose} />
      {/snippet}
    </Field>
    {#if src}
      <Button variant="text" tone="danger" {disabled} onclick={onremove}>{t("projects.dialog.removePicture")}</Button>
    {/if}
  </div>
</div>

<style>
  .logo-field {
    display: grid;
    grid-template-columns: var(--space-24) 1fr;
    align-items: start;
    gap: var(--space-4);
  }

  .controls {
    display: grid;
    justify-items: start;
    gap: var(--space-2);
    min-inline-size: 0;
  }

  .preview {
    border-radius: var(--radius-md);
    background: var(--color-surface-sunken);
    block-size: var(--space-16);
    overflow: hidden;
  }

  .preview img {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    object-fit: contain;
  }
</style>
