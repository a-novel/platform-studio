<script lang="ts">
  import { mergeAccountAction } from "$lib/application/auth/account-action";
  import AccountScreen from "$lib/ui/auth/AccountScreen.svelte";

  let { data, form } = $props();
  const model = $derived(mergeAccountAction(data.accountModel, form));
</script>

<svelte:head>
  <title>{data.accountCopy.title} — {data.shellCopy.brand}</title>
</svelte:head>

<AccountScreen
  copy={data.accountCopy}
  {model}
  actions={{
    password: "?/password",
    email: "?/email",
    logout: "?/logout",
  }}
/>
