import type { BackgroundSettings } from "./background";

export interface GradientPreset {
  id: string;
  name: string;
  from: string;
  to: string;
  angle: number;
  /** Darken (%) needed for white text to stay readable (WCAG AA 4.5:1). */
  dim: number;
}

/**
 * Gradients built from the Catppuccin Mocha palette
 * (https://catppuccin.com/palette), MIT licensed. Pastel accents are paired
 * with a darken level so white widget text stays readable; presets.test.ts
 * enforces it.
 */
export const GRADIENT_PRESETS: readonly GradientPreset[] = [
  {
    id: "mocha-night",
    name: "Mocha Night",
    from: "#1e1e2e",
    to: "#45305e",
    angle: 135,
    dim: 0,
  },
  {
    id: "mauve-dusk",
    name: "Mauve Dusk",
    from: "#1e1e2e",
    to: "#cba6f7",
    angle: 135,
    dim: 35,
  },
  {
    id: "ember",
    name: "Ember",
    from: "#1e1e2e",
    to: "#f38ba8",
    angle: 145,
    dim: 35,
  },
  {
    id: "sapphire-sea",
    name: "Sapphire Sea",
    from: "#11111b",
    to: "#74c7ec",
    angle: 160,
    dim: 40,
  },
  {
    id: "peach-sunset",
    name: "Peach Sunset",
    from: "#f38ba8",
    to: "#fab387",
    angle: 135,
    dim: 40,
  },
  {
    id: "lavender-sky",
    name: "Lavender Sky",
    from: "#b4befe",
    to: "#89b4fa",
    angle: 120,
    dim: 40,
  },
  {
    id: "mint-lagoon",
    name: "Mint Lagoon",
    from: "#a6e3a1",
    to: "#94e2d5",
    angle: 135,
    dim: 45,
  },
  {
    id: "aurora",
    name: "Aurora",
    from: "#cba6f7",
    to: "#94e2d5",
    angle: 135,
    dim: 45,
  },
  {
    id: "rosewater",
    name: "Rosewater",
    from: "#f5c2e7",
    to: "#f5e0dc",
    angle: 150,
    dim: 50,
  },
  {
    id: "golden-hour",
    name: "Golden Hour",
    from: "#f9e2af",
    to: "#fab387",
    angle: 125,
    dim: 50,
  },
];

export interface ColourPreset {
  id: string;
  name: string;
  colour: string;
  /** Darken (%) needed for white text to stay readable (WCAG AA 4.5:1). */
  dim: number;
}

/** Solid colours from the Catppuccin Mocha palette, paired the same way. */
export const COLOUR_PRESETS: readonly ColourPreset[] = [
  { id: "base", name: "Base", colour: "#1e1e2e", dim: 0 },
  { id: "crust", name: "Crust", colour: "#11111b", dim: 0 },
  { id: "surface", name: "Surface", colour: "#313244", dim: 0 },
  { id: "mauve", name: "Mauve", colour: "#cba6f7", dim: 35 },
  { id: "red", name: "Red", colour: "#f38ba8", dim: 35 },
  { id: "peach", name: "Peach", colour: "#fab387", dim: 40 },
  { id: "green", name: "Green", colour: "#a6e3a1", dim: 45 },
  { id: "teal", name: "Teal", colour: "#94e2d5", dim: 45 },
  { id: "sapphire", name: "Sapphire", colour: "#74c7ec", dim: 40 },
  { id: "blue", name: "Blue", colour: "#89b4fa", dim: 35 },
];

export function applyColourPreset(
  settings: BackgroundSettings,
  preset: ColourPreset,
): BackgroundSettings {
  return {
    ...settings,
    kind: "colour",
    colour: preset.colour,
    dim: preset.dim,
  };
}

export function isColourPresetActive(
  settings: BackgroundSettings,
  preset: ColourPreset,
): boolean {
  return (
    settings.kind === "colour" &&
    settings.colour.toLowerCase() === preset.colour
  );
}

export function colourSwatch(preset: ColourPreset): string {
  const shade = `linear-gradient(rgb(0 0 0 / ${preset.dim}%), rgb(0 0 0 / ${preset.dim}%))`;
  return `${shade}, ${preset.colour}`;
}

export function applyPreset(
  settings: BackgroundSettings,
  preset: GradientPreset,
): BackgroundSettings {
  return {
    ...settings,
    kind: "gradient",
    gradient: { from: preset.from, to: preset.to, angle: preset.angle },
    dim: preset.dim,
  };
}

export function isPresetActive(
  settings: BackgroundSettings,
  preset: GradientPreset,
): boolean {
  const g = settings.gradient;
  return (
    settings.kind === "gradient" &&
    g.from.toLowerCase() === preset.from &&
    g.to.toLowerCase() === preset.to &&
    g.angle === preset.angle
  );
}

/** CSS for a swatch showing the preset as it will look (darken included). */
export function presetSwatch(preset: GradientPreset): string {
  const shade = `linear-gradient(rgb(0 0 0 / ${preset.dim}%), rgb(0 0 0 / ${preset.dim}%))`;
  return `${shade}, linear-gradient(${preset.angle}deg, ${preset.from}, ${preset.to})`;
}
