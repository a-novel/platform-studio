import {
  type Locale,
  type Namespace,
  defaultLocale,
  defaultNamespace,
  namespaces as defaultNamespaces,
} from "./config";
import { loadNamespace } from "./resources";

import { type Resource, createInstance, type i18n } from "i18next";

async function loadLanguage(locale: Locale, namespaces: readonly Namespace[]): Promise<Resource[string]> {
  const entries = await Promise.all(
    namespaces.map(async (namespace) => [namespace, await loadNamespace(locale, namespace)] as const)
  );

  return Object.fromEntries(entries);
}

export async function createRequestI18n(
  locale: Locale,
  namespaces: readonly Namespace[] = defaultNamespaces
): Promise<i18n> {
  const resources: Resource = {
    [locale]: await loadLanguage(locale, namespaces),
  };

  if (locale !== defaultLocale) {
    resources[defaultLocale] = await loadLanguage(defaultLocale, namespaces);
  }

  const instance = createInstance();
  await instance.init({
    compatibilityJSON: "v4",
    defaultNS: defaultNamespace,
    fallbackLng: defaultLocale,
    interpolation: {
      escapeValue: false,
    },
    lng: locale,
    ns: [...namespaces],
    resources,
    returnNull: false,
  });

  return instance;
}
