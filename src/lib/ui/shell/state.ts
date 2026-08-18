import type { AuthDialogView } from "./types";

const authParameter = "auth";
const preferenceVersion = 1;

export const railPreferenceKey = "a-novel.studio.shell";

interface StorageReader {
  getItem(key: string): string | null;
}

interface StorageWriter {
  setItem(key: string, value: string): void;
}

function isAuthDialogView(value: string): value is AuthDialogView {
  return value === "login" || value === "register" || value === "reset";
}

/** Reads one canonical authentication view; duplicates and invalid values close the dialog. */
export function readAuthView(parameters: URLSearchParams): AuthDialogView | null {
  const values = parameters.getAll(authParameter);
  return values.length === 1 && values[0] !== undefined && isAuthDialogView(values[0]) ? values[0] : null;
}

/** Returns a URL with canonical authentication state while preserving unrelated state. */
export function withAuthView(url: URL, view: AuthDialogView | null): URL {
  const next = new URL(url);
  next.searchParams.delete(authParameter);
  if (view) next.searchParams.set(authParameter, view);
  return next;
}

/** Removes invalid or duplicate authentication values from a shareable URL. */
export function normalizeAuthUrl(url: URL): URL {
  return withAuthView(url, readAuthView(url.searchParams));
}

/** Reads the versioned rail preference without assuming a browser environment. */
export function readRailCollapsed(storage?: StorageReader): boolean {
  if (!storage) return false;

  try {
    const raw = storage.getItem(railPreferenceKey);
    if (!raw) return false;

    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return false;

    const preference = value as Record<string, unknown>;
    return preference.version === preferenceVersion && preference.railCollapsed === true;
  } catch {
    return false;
  }
}

/** Persists the current rail preference and reports whether storage accepted it. */
export function writeRailCollapsed(storage: StorageWriter | undefined, railCollapsed: boolean): boolean {
  if (!storage) return false;

  try {
    storage.setItem(
      railPreferenceKey,
      JSON.stringify({
        version: preferenceVersion,
        railCollapsed,
      })
    );
    return true;
  } catch {
    return false;
  }
}
