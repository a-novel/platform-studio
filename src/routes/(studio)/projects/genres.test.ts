import { type GenreFamily, genreChoices, genreFamilies, genreNames } from "./genres";

import { describe, expect, it } from "vitest";

import type { TFunction } from "i18next";

// Names each genre and family by its key, so the tests read the structure rather than a catalog.
const t = ((key: string) => key) as unknown as TFunction<"common">;

describe("genres", () => {
  it("sets each genre in one family", () => {
    const families = genreFamilies(t);
    const count = families.reduce((sum, { genres }) => sum + Object.keys(genres).length, 0);

    expect(Object.keys(genreNames(families))).toHaveLength(count);
  });

  it("offers each family's genres together, alphabetically, under the family's name", () => {
    const families: GenreFamily[] = [
      { name: "Fantasy", genres: { urbanFantasy: "Urban fantasy", darkFantasy: "Dark fantasy" } },
      { name: "Comedy", genres: { satire: "Satire", farce: "Farce" } },
    ];

    expect(genreChoices(families, "en")).toEqual([
      { value: "darkFantasy", label: "Dark fantasy", section: "Fantasy" },
      { value: "urbanFantasy", label: "Urban fantasy", section: "Fantasy" },
      { value: "farce", label: "Farce", section: "Comedy" },
      { value: "satire", label: "Satire", section: "Comedy" },
    ]);
  });
});
