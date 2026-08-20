<script module lang="ts">
  import type { ShortCodeActionData, ShortCodePageData } from "$lib/application/auth/short-code-route";

  export interface ConnectorProps {
    data: ShortCodePageData;
    form?: ShortCodeActionData | null;
  }
</script>

<script lang="ts">
  import Screen from "./screen.svelte";

  let { data, form }: ConnectorProps = $props();

  let submitting = $state(false);
  const returnedModel = $derived(form?.shortCode ?? data.model);
  const model = $derived(submitting ? { ...returnedModel, state: { status: "submitting" as const } } : returnedModel);

  function handleSubmit(): void {
    submitting = true;
  }
</script>

<Screen
  {model}
  action=""
  homeHref={data.links.homeHref}
  restartHref={data.links.restartHref}
  continueHref={data.links.continueHref}
  onSubmit={handleSubmit}
/>
