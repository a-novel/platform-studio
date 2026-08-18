<script lang="ts">
  import HomeScreen from "$lib/ui/shell/HomeScreen.svelte";

  let { data } = $props();
</script>

<svelte:head>
  <title>{data.shellCopy.homeTitle} — {data.shellCopy.brand}</title>
</svelte:head>

<HomeScreen title={data.shellCopy.homeTitle} />
