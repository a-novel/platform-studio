/** Each unit a time ago reads in, largest first, with its length in seconds. */
const units: readonly [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 86_400],
  ["month", 30 * 86_400],
  ["week", 7 * 86_400],
  ["day", 86_400],
  ["hour", 3600],
  ["minute", 60],
];

// One formatter per supported locale, which every request shares.
const formats = new Map<string, Intl.RelativeTimeFormat>();

/**
 * Says how long before `now` a moment was, in the largest unit that fits: "5 minutes ago", "yesterday".
 * The server and the browser count from the same `now`, so both render the same text.
 */
export function timeAgo(date: Date, now: Date, locale: string): string {
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  let format = formats.get(locale);
  if (!format) {
    format = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    formats.set(locale, format);
  }

  const unit = units.find(([, length]) => Math.abs(seconds) >= length);
  return unit ? format.format(Math.round(seconds / unit[1]), unit[0]) : format.format(0, "second");
}
