<script lang="ts">
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import { mergeAccountAction } from "$lib/application/auth/account-action";
  import { loginHref } from "$lib/application/auth/navigation";

  import ProtectedPage from "../(access)/screen.svelte";
  import { createAccountScreenController } from "./controller.svelte";
  import Screen from "./screen.svelte";

  import { untrack } from "svelte";

  import { getI18nContext } from "@a-novel-kit/nodelib-i18n/svelte";

  let { data, form } = $props();
  const { t } = getI18nContext();
  const actions = {
    password: "?/password",
    email: "?/email",
    logout: "?/logout",
  };
  const controller = createAccountScreenController({
    model: untrack(() => mergeAccountAction(data.accountModel, form)),
    actions,
  });

  $effect(() => {
    const model = mergeAccountAction(data.accountModel, form);
    untrack(() => controller.synchronize(model, actions));
  });
</script>

<svelte:head>
  <title>{t("authUi.account.title")} — {t("shell.brand")}</title>
</svelte:head>

{#snippet account()}
  <Screen {controller} />
{/snippet}

<ProtectedPage
  loginHref={loginHref(page.url.pathname + page.url.search)}
  homeHref={resolve("/")}
  retryHref={page.url.pathname + page.url.search}
  children={account}
  unavailable={account}
/>
