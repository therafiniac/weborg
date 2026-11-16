/**
 * Per-viewer panel conveniences (last section, panel size). Kept in
 * localStorage, which can be unavailable; every access is guarded.
 */

export type PanelMode = "normal" | "maximised" | "minimised";

const SECTION_KEY = "weborg:settings-section";
const MODE_KEY = "weborg:settings-mode";

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage blocked: the preference just won't be remembered
  }
}

export const readSection = () => read(SECTION_KEY);
export const writeSection = (id: string) => write(SECTION_KEY, id);

/** Minimised is not restored: a new tab opens settings at full size. */
export function readMode(): Exclude<PanelMode, "minimised"> {
  return read(MODE_KEY) === "maximised" ? "maximised" : "normal";
}
export const writeMode = (mode: Exclude<PanelMode, "minimised">) =>
  write(MODE_KEY, mode);
