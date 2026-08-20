<script lang="ts">
  import { mergeAccountAction } from "$lib/application/auth/account-action";

  import Screen from "./screen.svelte";

  let { data, form } = $props();
  const model = $derived(mergeAccountAction(data.accountModel, form));
</script>

<Screen
  {model}
  actions={{
    password: "?/password",
    email: "?/email",
    logout: "?/logout",
  }}
/>
