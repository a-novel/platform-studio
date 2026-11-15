import type { ProjectRow } from "./controller.svelte";
import { cartographer, harbor, notebooks, projects, salt } from "./projects.fixture";
import { readProjectsQuery, searchProjects, searchableProjects, withProjectsQuery } from "./search";

import { describe, expect, it } from "vitest";

const english = { drama: "Drama", historical: "Historical", mystery: "Mystery", psychological: "Psychological" };
const french = { drama: "Drame", historical: "Historique", mystery: "Mystère", psychological: "Psychologique" };

function search(query: string, genres: Record<string, string> = english, rows: ProjectRow[] = projects) {
  return searchProjects(searchableProjects(rows, genres), query);
}

describe("searchProjects", () => {
  it.each([
    { reads: "the title", query: "cartographer", expected: [cartographer] },
    { reads: "the premise", query: "mapmaker", expected: [cartographer] },
    { reads: "a tag", query: "huis-clos", expected: [notebooks] },
    { reads: "a genre's name", query: "historical", expected: [harbor] },
    { reads: "words in different fields", query: "mapmaker slow mystery", expected: [cartographer] },
    { reads: "part of a word", query: "car", expected: [cartographer, notebooks] },
  ])("matches a project when every word appears in $reads", ({ query, expected }) => {
    expect(search(query)).toEqual(expected);
  });

  it("refuses a project that lacks one of the words", () => {
    expect(search("cartographer drama")).toEqual([]);
  });

  it("ignores case and accents in both the query and the project", () => {
    expect(search("SIXIEME etage")).toEqual([notebooks]);
    expect(search("Éteignent")).toEqual([harbor]);
  });

  it("reads a ligature as the two letters it joins, in both the query and the project", () => {
    const row: ProjectRow = { ...salt, title: "Œuvre au noir", premise: "Un cœur ex æquo." };
    for (const query of ["oeuvre", "Œuvre", "COEUR", "ex aequo", "æquo"]) {
      expect(search(query, english, [row])).toEqual([row]);
    }
  });

  it("reads each genre by its name in the interface's language, and an unknown one by its value", () => {
    expect(search("mystère", french)).toEqual([cartographer]);
    expect(search("mystère", english)).toEqual([]);
    expect(search("magicalrealism", english)).toEqual([cartographer]);
  });

  it("keeps every project for a query without a word", () => {
    expect(search("")).toEqual(projects);
    expect(search("  \t ")).toEqual(projects);
  });

  it("never matches a word across two fields", () => {
    const row: ProjectRow = { ...salt, title: "Salt", premise: "water" };
    expect(search("saltwater", english, [row])).toEqual([]);
  });
});

describe("projects query in the address", () => {
  it("reads the query, empty without one", () => {
    expect(readProjectsQuery(new URLSearchParams("q=heures+claires"))).toBe("heures claires");
    expect(readProjectsQuery(new URLSearchParams("menu=open"))).toBe("");
  });

  it("writes the query and keeps the other parameters, and drops it once empty", () => {
    const url = new URL("https://studio.test/projects?menu=open&q=old");

    const searched = withProjectsQuery(url, "sixième étage");
    expect(readProjectsQuery(searched.searchParams)).toBe("sixième étage");
    expect(searched.searchParams.get("menu")).toBe("open");

    expect(withProjectsQuery(searched, "").href).toBe("https://studio.test/projects?menu=open");
    expect(url.href).toBe("https://studio.test/projects?menu=open&q=old");
  });
});
