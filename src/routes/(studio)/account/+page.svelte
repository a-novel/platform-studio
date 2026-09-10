<script lang="ts">
  import { mergeAccountAction } from "$lib/application/auth/account-action";

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

<Screen {controller} />
