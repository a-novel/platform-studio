<script module lang="ts">
  import type { Snippet } from "svelte";

  export interface SuccessStateProps {
    title: string;
    message?: string;
    actions?: Snippet;
  }
</script>

<script lang="ts">
  import { CircleCheck } from "@lucide/svelte";

  let { title, message, actions }: SuccessStateProps = $props();
</script>

<section class="success-state" role="status">
  <div class="success-mark" aria-hidden="true">
    <CircleCheck size="var(--icon-size-lg)" />
  </div>
  <h2>{title}</h2>
  {#if message}<p>{message}</p>{/if}
  {#if actions}
    <div class="actions">
      {@render actions()}
    </div>
  {/if}
</section>

<style>
  .success-state {
    display: grid;
    align-items: center;
    justify-items: center;
    gap: var(--space-3);
    text-align: center;
  }

  .success-mark {
    display: grid;
    place-items: center;
    border-radius: var(--radius-round);
    background: var(--color-feedback-success-surface);
    inline-size: var(--space-12);
    block-size: var(--space-12);
    color: var(--color-feedback-success-text);
  }

  h2,
  p {
    margin: 0;
  }

  h2 {
    color: var(--color-text-primary);
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-lg);
    line-height: var(--line-height-tight);
  }

  p {
    color: var(--color-text-secondary);
    line-height: var(--line-height-normal);
  }

  .actions :global(a) {
    font-weight: var(--font-weight-bold);
  }
</style>
