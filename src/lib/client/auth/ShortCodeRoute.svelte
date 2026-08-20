<script module lang="ts">
  import type { ShortCodeActionData, ShortCodePageData } from "$lib/application/auth/short-code-route";

  export interface ShortCodeRouteProps {
    data: ShortCodePageData;
    form?: ShortCodeActionData | null;
  }
</script>

<script lang="ts">
  import type { ShortCodeJourney } from "$lib/application/auth/types";
  import ShortCodeScreen from "$lib/ui/auth/ShortCodeScreen.svelte";

  import { getI18nContext } from "@a-novel-kit/nodelib-i18n/svelte";

  let { data, form }: ShortCodeRouteProps = $props();

  const { t } = getI18nContext();
  let submitting = $state(false);
  const returnedModel = $derived(form?.shortCode ?? data.model);
  const model = $derived(submitting ? { ...returnedModel, state: { status: "submitting" as const } } : returnedModel);

  function handleSubmit(): void {
    submitting = true;
  }

  function journeyTitle(journey: ShortCodeJourney): string {
    switch (journey) {
      case "email-update":
        return t("authUi.shortCode.journeys.emailUpdate.title");
      case "password-reset":
        return t("authUi.shortCode.journeys.passwordReset.title");
      case "register":
      default:
        return t("authUi.shortCode.journeys.register.title");
    }
  }
</script>

<svelte:head>
  <title>{journeyTitle(data.model.journey)} — {t("authUi.shortCode.brand")}</title>
</svelte:head>

<ShortCodeScreen
  {model}
  action=""
  homeHref={data.links.homeHref}
  restartHref={data.links.restartHref}
  continueHref={data.links.continueHref}
  onSubmit={handleSubmit}
/>
