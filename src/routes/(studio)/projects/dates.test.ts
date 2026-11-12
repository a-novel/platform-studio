import { timeAgo } from "./dates";

import { describe, expect, it } from "vitest";

const now = new Date("2026-11-08T12:00:00Z");
const ago = (seconds: number) => new Date(now.getTime() - seconds * 1000);

describe("timeAgo", () => {
  it.each([
    ["en", ago(10), "now"],
    ["en", ago(5 * 60), "5 minutes ago"],
    ["en", ago(3 * 3600), "3 hours ago"],
    ["en", ago(86_400), "yesterday"],
    ["en", ago(9 * 86_400), "last week"],
    ["en", ago(400 * 86_400), "last year"],
    ["fr", ago(5 * 60), "il y a 5 minutes"],
    ["fr", ago(2 * 86_400), "avant-hier"],
  ])("says in %s how long ago %s was", (locale, date, expected) => {
    expect(timeAgo(date, now, locale)).toBe(expected);
  });
});
