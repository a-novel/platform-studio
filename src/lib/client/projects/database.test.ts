import { type StoredProject, applyChange } from "./database";

import { describe, expect, it } from "vitest";

import { Language } from "@a-novel/service-narrative-engine-rest";

const held: StoredProject = {
  id: "019a5f2e-0000-7000-8000-000000000001",
  title: "Les Heures claires",
  premise: "Marie attend.",
  language: Language.Fr,
  tags: [],
  genres: ["drama"],
  createdAt: new Date("2026-10-01T10:00:00Z"),
  updatedAt: new Date("2026-10-02T10:00:00.123Z"),
  editedAt: new Date("2026-11-08T10:00:00Z"),
  logoChecksum: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
};
const other: StoredProject = { ...held, id: "019a5f2e-0000-7000-8000-000000000002", logoChecksum: undefined };

describe("applyChange", () => {
  it("writes the fields of a project, which keeps the logo held for it", () => {
    // A sweep brings no logo.
    const fields = { ...held, logoChecksum: undefined };
    const renamed = { ...fields, title: "Salt", updatedAt: new Date("2026-11-09T08:00:00.654Z") };
    const fresh = { ...fields, id: "019a5f2e-0000-7000-8000-000000000003" };

    expect(applyChange([held], { fields: [renamed, fresh] })).toEqual({
      put: [
        { ...renamed, logoChecksum: held.logoChecksum },
        { ...fresh, logoChecksum: undefined },
      ],
      remove: [],
    });
  });

  it("changes the edits and logos of projects held only, and only where they differ", () => {
    const editedAt = new Date("2026-11-09T09:00:00Z");
    const change = {
      edits: { [held.id]: editedAt, [other.id]: other.editedAt, "019a5f2e-0000-7000-8000-0000000000ff": editedAt },
      logos: { [held.id]: null, [other.id]: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" },
    };

    expect(applyChange([held, other], change)).toEqual({
      put: [
        { ...held, editedAt, logoChecksum: undefined },
        { ...other, logoChecksum: change.logos[other.id] },
      ],
      remove: [],
    });
  });

  it("sets the logo of a project the same change writes, as a save does", () => {
    const fields = { ...held, logoChecksum: undefined };

    expect(applyChange([], { fields: [fields], logos: { [held.id]: held.logoChecksum ?? null } }).put).toEqual([held]);
  });

  it("keeps the newer fields and edits held, which a sweep that asked before a save would turn back", () => {
    const older = new Date(held.updatedAt.getTime() - 1);
    const change = {
      fields: [{ ...held, title: "Stale", updatedAt: older, logoChecksum: undefined }],
      edits: { [held.id]: new Date(held.editedAt.getTime() - 1) },
    };

    expect(applyChange([held], change)).toEqual({ put: [], remove: [] });
  });

  it("keeps a later editedAt than newer fields bring, which the edits sweep wrote meanwhile", () => {
    const fields = {
      ...held,
      title: "Salt",
      updatedAt: new Date(held.updatedAt.getTime() + 1),
      editedAt: new Date(held.editedAt.getTime() - 1),
      logoChecksum: undefined,
    };

    expect(applyChange([held], { fields: [fields] }).put).toEqual([
      { ...fields, editedAt: held.editedAt, logoChecksum: held.logoChecksum },
    ]);
  });

  it("drops the projects removed, and ignores an ID it does not hold", () => {
    expect(applyChange([held, other], { edits: { [held.id]: new Date() }, removed: [held.id, "gone"] })).toEqual({
      put: [],
      remove: [held.id],
    });
  });
});
