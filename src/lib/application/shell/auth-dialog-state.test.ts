import { normalizeAuthUrl, readAuthView, withAuthView } from "./auth-dialog-state";

import { describe, expect, it } from "vitest";

describe("authentication URL state", () => {
  it.each(["login", "register", "reset"] as const)("round-trips the %s view", (view) => {
    const source = new URL("https://studio.example.test/work?document=42#selection");
    const encoded = withAuthView(source, view);

    expect(readAuthView(encoded.searchParams)).toBe(view);
    expect(encoded.searchParams.get("document")).toBe("42");
    expect(encoded.hash).toBe("#selection");
    expect(source.searchParams.has("auth")).toBe(false);
  });

  it("removes authentication state without changing unrelated parameters", () => {
    const source = new URL("https://studio.example.test/?auth=login&panel=outline");

    expect(withAuthView(source, null).href).toBe("https://studio.example.test/?panel=outline");
  });

  it.each(["unknown", "", "login&auth=register"])("normalizes invalid state %s to closed", (query) => {
    const source = new URL(`https://studio.example.test/?keep=yes&auth=${query}`);
    const normalized = normalizeAuthUrl(source);

    expect(readAuthView(source.searchParams)).toBeNull();
    expect(normalized.href).toBe("https://studio.example.test/?keep=yes");
  });
});
