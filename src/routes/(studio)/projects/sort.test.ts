import type { ProjectRow } from "./controller.svelte";
import { cartographer, harbor, notebooks, projects, salt } from "./projects.fixture";
import { DEFAULT_PROJECT_SORT, type ProjectSort, parseProjectSort, sortProjects } from "./sort";

import { describe, expect, it } from "vitest";

const collator = new Intl.Collator("en", { sensitivity: "base", numeric: true });

/** A copy of the salt project under another ID and title. */
function titled(id: string, title: string): ProjectRow {
  return { ...salt, id: `019a5f2e-0000-7000-8000-00000000010${id}`, title };
}

describe("sortProjects", () => {
  it.each<[ProjectSort, ProjectRow[]]>([
    [{ field: "editedAt", order: "descending" }, [harbor, cartographer, salt, notebooks]],
    [{ field: "editedAt", order: "ascending" }, [notebooks, salt, cartographer, harbor]],
    [{ field: "createdAt", order: "descending" }, [cartographer, harbor, notebooks, salt]],
    [{ field: "createdAt", order: "ascending" }, [salt, notebooks, harbor, cartographer]],
    [{ field: "title", order: "ascending" }, [notebooks, harbor, salt, cartographer]],
    [{ field: "title", order: "descending" }, [cartographer, salt, harbor, notebooks]],
  ])("sorts by %o", (sort, expected) => {
    expect(sortProjects(projects.toReversed(), sort, collator)).toEqual(expected);
  });

  it("compares titles by their letters and numbers, whatever their case and accents", () => {
    const rows = [titled("1", "Chapter 10"), titled("2", "chapter 9"), titled("3", "Écho"), titled("4", "Apple")];
    const sorted = sortProjects(rows, { field: "title", order: "ascending" }, collator);

    expect(sorted.map(({ title }) => title)).toEqual(["Apple", "chapter 9", "Chapter 10", "Écho"]);
  });

  it("keeps projects that tie in the order of their IDs, in both orders", () => {
    const rows = [titled("3", "echo"), titled("1", "Écho"), titled("2", "ECHO")];

    for (const order of ["ascending", "descending"] as const) {
      const sorted = sortProjects(rows, { field: "title", order }, collator);
      expect(sorted.map(({ id }) => id.at(-1))).toEqual(["1", "2", "3"]);
    }
  });
});

describe("parseProjectSort", () => {
  it.each([
    ["editedAt-descending", { field: "editedAt", order: "descending" }],
    ["createdAt-ascending", { field: "createdAt", order: "ascending" }],
    ["title-descending", { field: "title", order: "descending" }],
  ])("reads %s", (value, expected) => {
    expect(parseProjectSort(value)).toEqual(expected);
  });

  it.each([undefined, "", "title", "title-up", "logo-ascending", "title-ascending-x", " title-ascending"])(
    "falls back to the last edited first for %o",
    (value) => {
      expect(parseProjectSort(value)).toEqual(DEFAULT_PROJECT_SORT);
    }
  );
});
