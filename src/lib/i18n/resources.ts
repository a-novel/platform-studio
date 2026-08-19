import type { Locale, Namespace } from "./config";

import type { TranslationResource } from "@a-novel-kit/nodelib-i18n";

type ResourceModule = {
  default: TranslationResource;
};

type ResourceLoader = () => Promise<ResourceModule>;

const resourceLoaders = {
  en: {
    common: () => import("./locales/en/common.yaml"),
  },
  fr: {
    common: () => import("./locales/fr/common.yaml"),
  },
} satisfies Record<Locale, Record<Namespace, ResourceLoader>>;

export async function loadNamespace(locale: Locale, namespace: Namespace): Promise<TranslationResource> {
  const module = await resourceLoaders[locale][namespace]();
  return module.default;
}
