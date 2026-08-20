<script lang="ts">
  import Connector from "./connector.svelte";

  let { children, data } = $props();
</script>

<Connector activeNavigation={data.activeNavigation === "home" ? "home" : null} session={data.session}>
  {@render children()}
</Connector>
