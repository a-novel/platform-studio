<script lang="ts">
  import { mergeAccountAction } from "$lib/application/auth/account-action";
  import AccountScreen from "$lib/ui/auth/AccountScreen.svelte";

  import { getI18nContext } from "@a-novel-kit/nodelib-i18n/svelte";

  let { data, form } = $props();
  const { t } = getI18nContext();
  const model = $derived(mergeAccountAction(data.accountModel, form));
</script>

<svelte:head>
  <title>{t("authUi.account.title")} — {t("shell.brand")}</title>
</svelte:head>

<AccountScreen
  {model}
  actions={{
    password: "?/password",
    email: "?/email",
    logout: "?/logout",
  }}
/>
