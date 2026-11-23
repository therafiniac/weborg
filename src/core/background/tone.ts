/**
 * Which text reads best on a background: white, or near-black. Used for
 * text that sits straight on the background (clock, greeting, plain links).
 */

export type Backdrop = "dark" | "light";

/** Matches --backdrop-text in styles/global.css. */
export const LIGHT_TEXT = "#ffffff";
export const DARK_TEXT = "#1a1d2e";

function channels(hex: string): [number, number, number] | null {
  let value = hex.trim().replace(/^#/, "");
  if (value.length === 3) value = value.replace(/./g, (c) => c + c);
  if (!/^[\da-f]{6}$/i.test(value)) return null;
  const n = parseInt(value, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function luminance(hex: string): number {
  const rgb = channels(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [
    number,
    number,
  ];
  return (hi + 0.05) / (lo + 0.05);
}

/** The colour after the Darken overlay (black at `dim` percent). */
export function darken(hex: string, dim: number): string {
  const rgb = channels(hex);
  if (!rgb) return hex;
  const keep = 1 - Math.min(80, Math.max(0, dim)) / 100;
  return (
    "#" +
    rgb
      .map((c) =>
        Math.round(c * keep)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}

/**
 * The text that keeps the best worst-case contrast across every colour the
 * background shows (both ends of a gradient), after darkening.
 */
export function backdropFor(colours: string[], dim = 0): Backdrop {
  const shown = colours.map((colour) => darken(colour, dim));
  const worst = (text: string) =>
    Math.min(...shown.map((colour) => contrast(text, colour)));
  return worst(LIGHT_TEXT) >= worst(DARK_TEXT) ? "dark" : "light";
}

/**
 * Average colour of an image, from a tiny downscaled copy. Runs on this
 * device only. Null when the browser cannot decode or draw it.
 */
export async function averageColour(blob: Blob): Promise<string | null> {
  try {
    const bitmap = await createImageBitmap(blob, {
      resizeWidth: 24,
      resizeHeight: 24,
    });
    const canvas = document.createElement("canvas");
    canvas.width = 24;
    canvas.height = 24;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(bitmap, 0, 0, 24, 24);
    bitmap.close();
    const { data } = context.getImageData(0, 0, 24, 24);
    let r = 0;
    let g = 0;
    let b = 0;
    const pixels = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i] ?? 0;
      g += data[i + 1] ?? 0;
      b += data[i + 2] ?? 0;
    }
    const hex = (n: number) =>
      Math.round(n / pixels)
        .toString(16)
        .padStart(2, "0");
    return `#${hex(r)}${hex(g)}${hex(b)}`;
  } catch {
    return null;
  }
}
