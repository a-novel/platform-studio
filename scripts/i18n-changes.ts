import { defaultLocale } from "../src/lib/i18n/config.ts";

import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";

import { parse } from "yaml";

const catalogDirectory = "src/lib/i18n/locales";
const pluralSuffix = /_(?:zero|one|two|few|many|other)$/;

/** Messages of one locale, keyed by `namespace:key`. */
export type Catalog = ReadonlyMap<string, string>;

/** One locale's messages at the merge base and at HEAD. */
export interface Revision {
  base: Catalog;
  head: Catalog;
}

/** A key's plural forms, which compare as one message since locales use different plural categories. */
interface Group {
  forms: string;
  translated: boolean;
}

/**
 * Lists the keys whose translation the branch left empty: new keys and emptied translations. A gap
 * already present at the merge base is existing debt and is not reported again.
 */
export function findGaps(translation: Revision): string[] {
  const base = groupPluralForms(translation.base);
  return [...groupPluralForms(translation.head)]
    .filter(([key, group]) => !group.translated && (base.get(key)?.translated ?? true))
    .map(([key]) => key);
}

/**
 * Lists the keys whose source message changed since the merge base while the translation kept its
 * value. A new key or an empty translation is a gap instead.
 */
export function findDrift(source: Revision, translation: Revision): string[] {
  const sourceBase = groupPluralForms(source.base);
  const translationBase = groupPluralForms(translation.base);
  const translationHead = groupPluralForms(translation.head);

  return [...groupPluralForms(source.head)]
    .filter(([key, group]) => {
      const previous = sourceBase.get(key);
      const translated = translationHead.get(key);
      return (
        previous !== undefined &&
        previous.forms !== group.forms &&
        translated?.translated === true &&
        translated.forms === translationBase.get(key)?.forms
      );
    })
    .map(([key]) => key);
}

function groupPluralForms(catalog: Catalog): Map<string, Group> {
  const groups = new Map<string, [string, string][]>();
  for (const [key, message] of catalog) {
    const name = key.replace(pluralSuffix, "");
    groups.set(name, [...(groups.get(name) ?? []), [key, message]]);
  }
  return new Map(
    [...groups].map(([name, forms]) => [
      name,
      {
        forms: JSON.stringify(forms.toSorted(([a], [b]) => a.localeCompare(b))),
        translated: forms.some(([, message]) => message !== ""),
      },
    ])
  );
}

function flatten(value: unknown, prefix: string, into: Map<string, string>): void {
  if (typeof value === "string") into.set(prefix, value);
  else if (value !== null && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      flatten(child, prefix.endsWith(":") ? prefix + key : `${prefix}.${key}`, into);
    }
  }
}

function readCatalog(locale: string, read: (path: string) => string | undefined): Catalog {
  const messages = new Map<string, string>();
  for (const file of readdirSync(join(catalogDirectory, defaultLocale))) {
    const content = read(join(catalogDirectory, locale, file));
    if (content !== undefined) flatten(parse(content), `${file.replace(/\.ya?ml$/, "")}:`, messages);
  }
  return messages;
}

function git(...args: string[]): string {
  return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
}

function attempt(read: () => string): string | undefined {
  try {
    return read();
  } catch {
    return undefined;
  }
}

const checks = {
  gaps: {
    find: (_source: Revision, translation: Revision) => findGaps(translation),
    problem: "Translations left empty by this branch",
    fix: "Translate each key, or apply allow-incomplete-translations to render the source text.",
  },
  drift: {
    find: findDrift,
    problem: "Source messages changed while their translations did not",
    fix: "Update each translation, give a changed meaning a new key, or apply allow-translation-drift.",
  },
};

if (import.meta.main) {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: { base: { type: "string", default: "origin/master" } },
  });
  const [name] = positionals;
  if (name !== "gaps" && name !== "drift") throw new TypeError("Expected the check to run: gaps or drift");
  const check = checks[name];

  const mergeBase = git("merge-base", "HEAD", values.base).trim();
  const revision = (locale: string): Revision => ({
    base: readCatalog(locale, (path) => attempt(() => git("show", `${mergeBase}:${path}`))),
    head: readCatalog(locale, (path) => attempt(() => readFileSync(path, "utf8"))),
  });

  const source = revision(defaultLocale);
  const problems = readdirSync(catalogDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== defaultLocale)
    .flatMap(({ name }) => check.find(source, revision(name)).map((key) => `  ${name} ${key}`));

  if (problems.length > 0) {
    process.stderr.write(`${check.problem}:\n${problems.join("\n")}\n${check.fix}\n`);
    process.exitCode = 1;
  }
}
