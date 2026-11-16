/** Font choices offered in settings. "" means "inherit / default". */
export const FONT_STACKS = {
  system: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  sans: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
  rounded: 'ui-rounded, "SF Pro Rounded", "Nunito", system-ui, sans-serif',
} as const;

export const FONT_LABELS: Record<keyof typeof FONT_STACKS, string> = {
  system: "System",
  sans: "Sans-serif",
  serif: "Serif",
  mono: "Monospace",
  rounded: "Rounded",
};

export type FontKey = keyof typeof FONT_STACKS;

const isFontKey = (value: string): value is FontKey =>
  Object.hasOwn(FONT_STACKS, value);

/**
 * Stored font value -> CSS font-family. Values are either a preset key or a
 * custom font name typed by the user (wrapped in quotes, with a fallback).
 */
export function fontFamilyCss(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (isFontKey(trimmed)) return FONT_STACKS[trimmed];
  // Strip characters that could break out of the declaration
  const safe = trimmed.replace(/["';{}<>\\]/g, "");
  return safe ? `"${safe}", system-ui, sans-serif` : undefined;
}

export const isPresetFont = (value: string) => !value || isFontKey(value);
