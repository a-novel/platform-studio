export const supportedLocales = ["en", "fr"] as const;
export const namespaces = ["common"] as const;
export const defaultLocale = "en";
export const defaultNamespace = "common";

export type Locale = (typeof supportedLocales)[number];
export type Namespace = (typeof namespaces)[number];

export function isLocale(value: string): value is Locale {
  return supportedLocales.includes(value as Locale);
}

export function resolveLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) {
    return defaultLocale;
  }

  const preferences = acceptLanguage
    .split(",")
    .map((entry, index) => {
      const [rawTag = "", ...parameters] = entry.trim().split(";");
      const qualityParameter = parameters.find((parameter) => parameter.trim().startsWith("q="));
      const parsedQuality = qualityParameter ? Number.parseFloat(qualityParameter.trim().slice(2)) : 1;

      return {
        index,
        quality: Number.isFinite(parsedQuality) ? parsedQuality : 0,
        tag: rawTag.toLowerCase(),
      };
    })
    .filter(({ quality, tag }) => quality > 0 && tag !== "*")
    .sort((left, right) => right.quality - left.quality || left.index - right.index);

  for (const { tag } of preferences) {
    const language = tag.split("-")[0];
    if (language && isLocale(language)) {
      return language;
    }
  }

  return defaultLocale;
}
