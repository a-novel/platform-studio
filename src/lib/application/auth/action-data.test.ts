import { readAuthenticationActionModel } from "./action-data";

import { describe, expect, it } from "vitest";

describe("readAuthenticationActionModel", () => {
  it("returns the action model only for the active journey", () => {
    const model = {
      journey: "login" as const,
      state: { status: "service-error" as const, message: "Unavailable" },
    };

    expect(readAuthenticationActionModel({ authentication: model }, "login")).toBe(model);
    expect(readAuthenticationActionModel({ authentication: model }, "register")).toBeNull();
  });

  it.each([null, undefined, "invalid", {}, { authentication: null }])("ignores malformed action data %#", (data) => {
    expect(readAuthenticationActionModel(data, "reset")).toBeNull();
  });
});
