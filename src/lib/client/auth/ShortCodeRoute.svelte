<script module lang="ts">
  import type { ShortCodeActionData, ShortCodePageData } from "$lib/application/auth/short-code-route";

  export interface ShortCodeRouteProps {
    data: ShortCodePageData;
    form?: ShortCodeActionData | null;
  }
</script>

<script lang="ts">
  import ShortCodeScreen from "$lib/ui/auth/ShortCodeScreen.svelte";

  let { data, form }: ShortCodeRouteProps = $props();

  let submitting = $state(false);
  const returnedModel = $derived(form?.shortCode ?? data.model);
  const model = $derived(submitting ? { ...returnedModel, state: { status: "submitting" as const } } : returnedModel);

  function handleSubmit(): void {
    submitting = true;
  }
</script>

<svelte:head>
  <title>{data.pageTitle} — {data.copy.brand}</title>
</svelte:head>

<ShortCodeScreen
  copy={data.copy}
  {model}
  action=""
  homeHref={data.links.homeHref}
  restartHref={data.links.restartHref}
  continueHref={data.links.continueHref}
  onSubmit={handleSubmit}
/>
