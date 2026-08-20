import { mergeAccountAction, readyAccountModel } from "./account-action";

import { describe, expect, it } from "vitest";

const ready = readyAccountModel({
  status: "ready",
  claims: {
    userId: "140f24ee-1531-4a9d-ace8-20b38e1b21bc",
    roles: ["auth:user"],
    accessExpiresAt: "soon",
    refreshExpiresAt: "later",
  },
});

describe("mergeAccountAction", () => {
  it("overlays only the password action state", () => {
    expect(
      mergeAccountAction(ready, {
        accountAction: {
          kind: "password",
          state: { status: "success", message: "Changed" },
        },
      })
    ).toEqual({
      ...ready,
      passwordState: { status: "success", message: "Changed" },
    });
  });

  it("overlays only the email action state", () => {
    expect(
      mergeAccountAction(ready, {
        accountAction: {
          kind: "email",
          state: { status: "pending-email", targetHint: "creator@example.com" },
        },
      })
    ).toEqual({
      ...ready,
      emailState: { status: "pending-email", targetHint: "creator@example.com" },
    });
  });

  it("does not attach action state to an unavailable account model", () => {
    const unavailable = { status: "error", message: "Unavailable" } as const;
    expect(
      mergeAccountAction(unavailable, {
        accountAction: {
          kind: "password",
          state: { status: "success", message: "Changed" },
        },
      })
    ).toBe(unavailable);
  });
});
