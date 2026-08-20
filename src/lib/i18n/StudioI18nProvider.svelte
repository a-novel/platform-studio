<script module lang="ts">
  import type { Locale } from "./config";

  import type { Snippet } from "svelte";

  /** Props for one locale-isolated Studio translation scope. */
  export interface StudioI18nProviderProps {
    children: Snippet;
    locale: Locale;
  }
</script>

<script lang="ts">
  import { createStudioI18n } from "./instance";

  import { untrack } from "svelte";

  import { setI18nContext } from "@a-novel-kit/nodelib-i18n/svelte";

  let { children, locale }: StudioI18nProviderProps = $props();

  setI18nContext(createStudioI18n(untrack(() => locale)));
</script>

{@render children()}
