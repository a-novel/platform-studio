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
  import { defaultLocale, defaultNamespace, namespaces } from "./config";
  import { resources } from "./resources";

  import { untrack } from "svelte";

  import { createStaticI18n } from "@a-novel-kit/nodelib-i18n";
  import { setI18nContext } from "@a-novel-kit/nodelib-i18n/svelte";

  let { children, locale }: StudioI18nProviderProps = $props();

  setI18nContext(
    createStaticI18n({
      defaultLocale,
      defaultNamespace,
      locale: untrack(() => locale),
      namespaces,
      resources,
    })
  );
</script>

{@render children()}
