<script lang="ts">
  import type { TFunction } from "i18next";

  type Perspective = "creator" | "reader";

  interface Props {
    count?: number;
    perspective?: Perspective;
    t: TFunction<"common">;
  }

  let { count = 2, perspective = "creator", t }: Props = $props();

  const perspectiveLabel = $derived(
    perspective === "creator"
      ? t("fixture.perspective", { context: "creator" })
      : t("fixture.perspective", { context: "reader" })
  );
  const collaboratorsLabel = $derived(
    perspective === "creator"
      ? t("fixture.collaborators", { context: "creator", count })
      : t("fixture.collaborators", { context: "reader", count })
  );
</script>

<section aria-labelledby="localization-fixture-title">
  <h2 id="localization-fixture-title">{t("fixture.ready")}</h2>
  <dl>
    <div>
      <dt>Plural</dt>
      <dd>{t("fixture.items", { count })}</dd>
    </div>
    <div>
      <dt>Context</dt>
      <dd>{perspectiveLabel}</dd>
    </div>
    <div>
      <dt>Context and plural</dt>
      <dd>{collaboratorsLabel}</dd>
    </div>
  </dl>
</section>

<style>
  section {
    border: var(--border-width-thin) solid var(--color-border-subtle);
    border-radius: var(--radius-lg);
    background: var(--color-surface-raised);
    padding: var(--space-6);
    max-inline-size: 36rem;
    color: var(--color-text-primary);
  }

  h2 {
    margin: 0 0 var(--space-5);
    font: var(--font-heading-md);
  }

  dl {
    display: grid;
    gap: var(--space-3);
    margin: 0;
  }

  dl > div {
    display: grid;
    grid-template-columns: minmax(8rem, 1fr) 2fr;
    gap: var(--space-4);
  }

  dt {
    color: var(--color-text-muted);
  }

  dd {
    margin: 0;
  }
</style>
