import { accountDisplayFromHandle } from "./account-display";

import { describe, expect, it } from "vitest";

describe("accountDisplayFromHandle", () => {
  it.each([
    ["maya.chen", { displayName: "Maya Chen", initials: "MC" }],
    ["MAYA", { displayName: "Maya", initials: "M" }],
    ["sarah-jane.o_neil+studio", { displayName: "Sarah Jane O Neil", initials: "SJ" }],
  ])("derives a readable account label from the handle %s", (handle, expected) => {
    expect(accountDisplayFromHandle(handle)).toEqual(expected);
  });
});
