import {
  type Locale,
  type Namespace,
  defaultLocale,
  defaultNamespace,
  namespaces as defaultNamespaces,
} from "./config";
import { loadNamespace } from "./resources";

import { createRequestI18n as createI18n } from "@a-novel-kit/nodelib-i18n";

import type { i18n } from "i18next";

export async function createRequestI18n(
  locale: Locale,
  namespaces: readonly Namespace[] = defaultNamespaces
): Promise<i18n> {
  return createI18n({
    defaultLocale,
    defaultNamespace,
    loadNamespace,
    locale,
    namespaces,
  });
}
