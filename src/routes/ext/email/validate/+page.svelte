<script lang="ts">
  import ShortCodeRoute from "$lib/client/auth/ShortCodeRoute.svelte";

  let { data, form } = $props();
</script>

<ShortCodeRoute {data} {form} />
