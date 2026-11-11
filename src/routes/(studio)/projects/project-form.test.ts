import { LOGO_REMOVED_FIELD, readProjectForm } from "./project-form";

import { describe, expect, it } from "vitest";

import { Language } from "@a-novel/service-narrative-engine-rest";

function form(fields: Record<string, string | File>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.set(name, value);
  return data;
}

const fields = { title: "Salt", premise: "", language: "en" };

describe("readProjectForm", () => {
  it("sets a chosen logo", () => {
    const logo = new File(["webp"], "logo", { type: "image/webp" });

    expect(readProjectForm(form({ ...fields, logo }))).toEqual({
      success: true,
      value: { id: undefined, title: "Salt", premise: "", language: Language.En, genres: [], tags: [], logo },
    });
  });

  it("removes a logo the form asks to, and leaves it alone otherwise", () => {
    expect(readProjectForm(form({ ...fields, [LOGO_REMOVED_FIELD]: "true" }))).toMatchObject({
      value: { logo: "remove" },
    });
    expect(readProjectForm(form(fields))).toMatchObject({ value: { logo: undefined } });
  });

  it("reads every genre checked, and refuses more than 10", () => {
    const chosen = form(fields);
    chosen.append("genres", "fantasy");
    chosen.append("genres", "horror");
    expect(readProjectForm(chosen)).toMatchObject({ value: { genres: ["fantasy", "horror"] } });

    const tooMany = form(fields);
    for (let genre = 0; genre < 11; genre += 1) tooMany.append("genres", `genre-${genre}`);
    expect(readProjectForm(tooMany)).toEqual({ success: false, issues: [{ field: "genres", code: "tooMany" }] });
  });

  it("reads the tags the field sent, and the text still typed in it, in lower-kebab-case once each", () => {
    const sent = form(fields);
    for (const tag of ["roman-maritime", "années-50", "Huis Clos, roman-maritime", ""]) sent.append("tags", tag);

    expect(readProjectForm(sent)).toMatchObject({ value: { tags: ["roman-maritime", "années-50", "huis", "clos"] } });
  });

  it("ignores an empty file input", () => {
    const result = readProjectForm(form({ ...fields, logo: new File([], "") }));

    expect(result).toMatchObject({ success: true, value: { logo: undefined } });
  });

  it.each([
    ["a blank title", { title: "  " }, [{ field: "title", code: "required" }]],
    ["a title past 200 characters", { title: "a".repeat(201) }, [{ field: "title", code: "tooLong" }]],
    ["a premise past 20,000 characters", { premise: "a".repeat(20_001) }, [{ field: "premise", code: "tooLong" }]],
    ["an unknown language", { language: "de" }, [{ field: "language", code: "required" }]],
    ["more than 10 tags", { tags: "a,b,c,d,e,f,g,h,i,j,k" }, [{ field: "tags", code: "tooMany" }]],
    ["a tag past 24 characters", { tags: "a".repeat(25) }, [{ field: "tags", code: "tooLong" }]],
    ["a project ID no dialog sends", { id: "not-a-uuid" }, []],
  ])("refuses %s", (_, change, issues) => {
    expect(readProjectForm(form({ ...fields, ...change }))).toEqual({ success: false, issues });
  });
});
