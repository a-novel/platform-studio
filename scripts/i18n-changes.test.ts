import { findDrift, findGaps } from "./i18n-changes.ts";

import { describe, expect, it } from "vitest";

type Messages = Record<string, string>;

function revision(base: Messages, head: Messages) {
  return { base: new Map(Object.entries(base)), head: new Map(Object.entries(head)) };
}

const pluralSource = { "common:items_one": "{{count}} item", "common:items_other": "{{count}} items" };
const pluralTranslation = {
  "common:items_one": "{{count}} élément",
  "common:items_many": "{{count}} éléments",
  "common:items_other": "{{count}} éléments",
};

describe("findGaps", () => {
  it.each<{ name: string; translation: [Messages, Messages]; gaps: string[] }>([
    {
      name: "reports a new key left empty",
      translation: [{}, { "common:home": "" }],
      gaps: ["common:home"],
    },
    {
      name: "reports a translation the branch emptied",
      translation: [{ "common:home": "Revenir à l’accueil" }, { "common:home": "" }],
      gaps: ["common:home"],
    },
    {
      name: "leaves a gap already on the base branch as existing debt",
      translation: [{ "common:home": "" }, { "common:home": "" }],
      gaps: [],
    },
    {
      name: "accepts a translated key",
      translation: [{}, { "common:home": "Revenir à l’accueil" }],
      gaps: [],
    },
    {
      name: "accepts a plural group with any translated form",
      translation: [{}, { "common:items_one": "{{count}} élément", "common:items_many": "", "common:items_other": "" }],
      gaps: [],
    },
  ])("$name", ({ translation, gaps }) => {
    expect(findGaps(revision(...translation))).toEqual(gaps);
  });
});

describe("findDrift", () => {
  it.each<{ name: string; source: [Messages, Messages]; translation: [Messages, Messages]; drift: string[] }>([
    {
      name: "reports a changed source whose translation kept its value",
      source: [{ "common:home": "Back to home" }, { "common:home": "Return home" }],
      translation: [{ "common:home": "Retour à l’accueil" }, { "common:home": "Retour à l’accueil" }],
      drift: ["common:home"],
    },
    {
      name: "accepts a translation updated with its source",
      source: [{ "common:home": "Back to home" }, { "common:home": "Return home" }],
      translation: [{ "common:home": "Retour à l’accueil" }, { "common:home": "Revenir à l’accueil" }],
      drift: [],
    },
    {
      name: "ignores an unchanged source",
      source: [{ "common:home": "Return home" }, { "common:home": "Return home" }],
      translation: [{ "common:home": "Revenir à l’accueil" }, { "common:home": "Revenir à l’accueil" }],
      drift: [],
    },
    {
      name: "leaves a new source key to the gap check",
      source: [{}, { "common:home": "Return home" }],
      translation: [{}, { "common:home": "" }],
      drift: [],
    },
    {
      name: "leaves an empty translation to the gap check",
      source: [{ "common:home": "Back to home" }, { "common:home": "Return home" }],
      translation: [{ "common:home": "" }, { "common:home": "" }],
      drift: [],
    },
    {
      name: "ignores a removed source key",
      source: [{ "common:home": "Back to home" }, {}],
      translation: [{ "common:home": "Retour à l’accueil" }, { "common:home": "Retour à l’accueil" }],
      drift: [],
    },
    {
      name: "reports a plural group once when its translation forms all kept their values",
      source: [pluralSource, { ...pluralSource, "common:items_other": "{{count}} entries" }],
      translation: [pluralTranslation, pluralTranslation],
      drift: ["common:items"],
    },
    {
      name: "accepts a plural group whose translation updated any form",
      source: [pluralSource, { ...pluralSource, "common:items_other": "{{count}} entries" }],
      translation: [pluralTranslation, { ...pluralTranslation, "common:items_other": "{{count}} entrées" }],
      drift: [],
    },
  ])("$name", ({ source, translation, drift }) => {
    expect(findDrift(revision(...source), revision(...translation))).toEqual(drift);
  });
});
