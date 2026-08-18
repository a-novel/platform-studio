import {
  normalizeAuthUrl,
  railPreferenceKey,
  readAuthView,
  readRailCollapsed,
  withAuthView,
  writeRailCollapsed,
} from "./state";

import { describe, expect, it, vi } from "vitest";

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

describe("rail preference", () => {
  it("is SSR-safe and defaults to expanded", () => {
    expect(readRailCollapsed()).toBe(false);
  });

  it("reads only the current version and explicit collapsed value", () => {
    expect(readRailCollapsed({ getItem: () => '{"version":1,"railCollapsed":true}' })).toBe(true);
    expect(readRailCollapsed({ getItem: () => '{"version":2,"railCollapsed":true}' })).toBe(false);
    expect(readRailCollapsed({ getItem: () => '{"version":1,"railCollapsed":false}' })).toBe(false);
  });

  it.each(["not-json", "null", "[]", '{"version":1}'])("ignores malformed preference %s", (value) => {
    expect(readRailCollapsed({ getItem: () => value })).toBe(false);
  });

  it("persists a versioned preference", () => {
    const setItem = vi.fn();

    expect(writeRailCollapsed({ setItem }, true)).toBe(true);
    expect(setItem).toHaveBeenCalledWith(railPreferenceKey, '{"version":1,"railCollapsed":true}');
  });

  it("contains unavailable storage failures", () => {
    const getItem = vi.fn(() => {
      throw new Error("storage denied");
    });
    const setItem = vi.fn(() => {
      throw new Error("storage denied");
    });

    expect(readRailCollapsed({ getItem })).toBe(false);
    expect(writeRailCollapsed({ setItem }, true)).toBe(false);
  });
});
