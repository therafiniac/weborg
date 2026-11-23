import type { BackgroundSettings, Fill } from "./background";

/**
 * Background presets. Text on the background picks white or near-black
 * from the background's brightness (tone.ts), so presets need no darkening
 * to stay readable; presets.test.ts checks every one reaches WCAG AA.
 */

export interface DynamicPreset {
  id: string;
  name: string;
  dark: Fill;
  light: Fill;
}

const gradient = (from: string, to: string, angle = 135): Fill => ({
  type: "gradient",
  from,
  to,
  angle,
});
const colour = (value: string): Fill => ({ type: "colour", colour: value });

/** Each has a dark and a light version that switch with the theme. */
export const DYNAMIC_PRESETS: readonly DynamicPreset[] = [
  {
    id: "mist",
    name: "Mist",
    dark: gradient("#1b1d2a", "#2c3043", 160),
    light: gradient("#eef1f6", "#dde3ec", 160),
  },
  {
    id: "aurora",
    name: "Aurora",
    dark: gradient("#10202a", "#2a2048"),
    light: gradient("#e4f4f1", "#ece5fa"),
  },
  {
    id: "dusk",
    name: "Dusk",
    dark: gradient("#1e1626", "#4a2a3a", 145),
    light: gradient("#fdeee4", "#f6dbe4", 145),
  },
  {
    id: "ocean",
    name: "Ocean",
    dark: gradient("#0b1a2b", "#1f4e6b", 160),
    light: gradient("#e3f1fb", "#cfe5f5", 160),
  },
  {
    id: "forest",
    name: "Forest",
    dark: gradient("#121e17", "#28443a"),
    light: gradient("#e9f3ea", "#d6e9da"),
  },
  {
    id: "lavender",
    name: "Lavender",
    dark: gradient("#1a1528", "#3d2f5e", 120),
    light: gradient("#f0ecfb", "#e0d8f6", 120),
  },
  {
    id: "sand",
    name: "Sand",
    dark: gradient("#1f1a14", "#3d3226", 150),
    light: gradient("#f8f2e8", "#ece1cf", 150),
  },
  {
    id: "rose",
    name: "Rose",
    dark: gradient("#22141c", "#5a2a40", 140),
    light: gradient("#fdecef", "#f7d6df", 140),
  },
  {
    id: "ember",
    name: "Ember",
    dark: gradient("#1c1210", "#5a2a1c", 145),
    light: gradient("#fff0e6", "#fbd9c6", 145),
  },
  {
    id: "mint",
    name: "Mint",
    dark: gradient("#0f1d1a", "#1f4a40", 135),
    light: gradient("#e8f8f2", "#cfeee3", 135),
  },
  {
    id: "sky",
    name: "Sky",
    dark: gradient("#0e1626", "#27406e", 170),
    light: gradient("#eef5ff", "#d6e6fb", 170),
  },
  {
    id: "berry",
    name: "Berry",
    dark: gradient("#1c1022", "#4a1f55", 130),
    light: gradient("#f8ebfa", "#ead4f2", 130),
  },
  {
    id: "citrus",
    name: "Citrus",
    dark: gradient("#1a1a0f", "#44421c", 125),
    light: gradient("#fbfbe6", "#eef2c9", 125),
  },
  {
    id: "storm",
    name: "Storm",
    dark: gradient("#121418", "#2e3440", 180),
    light: gradient("#f1f3f5", "#d9dee5", 180),
  },
  {
    id: "ink",
    name: "Ink",
    dark: gradient("#0a0c14", "#1a2140", 155),
    light: gradient("#f3f4f9", "#e1e4f0", 155),
  },
  {
    id: "neutral",
    name: "Neutral",
    dark: colour("#18181b"),
    light: colour("#f4f4f5"),
  },
];

export const DEFAULT_DYNAMIC = "mist";

export const getDynamicPreset = (id: string) =>
  DYNAMIC_PRESETS.find((preset) => preset.id === id);

export interface GradientPreset {
  id: string;
  name: string;
  from: string;
  to: string;
  angle: number;
}

/** Dark ones first (Mocha Night from Catppuccin, MIT), then light ones. */
export const GRADIENT_PRESETS: readonly GradientPreset[] = [
  {
    id: "mocha-night",
    name: "Mocha Night",
    from: "#1e1e2e",
    to: "#45305e",
    angle: 135,
  },
  {
    id: "deep-sea",
    name: "Deep Sea",
    from: "#0b1a2b",
    to: "#1f4e6b",
    angle: 160,
  },
  {
    id: "ember-night",
    name: "Ember Night",
    from: "#1e1e2e",
    to: "#5c2433",
    angle: 145,
  },
  {
    id: "northern",
    name: "Northern",
    from: "#0f1c1e",
    to: "#1d4a44",
    angle: 135,
  },
  { id: "plum", name: "Plum", from: "#1a1423", to: "#5a3d73", angle: 135 },
  {
    id: "graphite",
    name: "Graphite",
    from: "#16171d",
    to: "#3a3d4a",
    angle: 180,
  },
  {
    id: "morning-mist",
    name: "Morning Mist",
    from: "#eef1fb",
    to: "#efe4f7",
    angle: 135,
  },
  {
    id: "peach-cream",
    name: "Peach Cream",
    from: "#fde7dc",
    to: "#fbd3c4",
    angle: 135,
  },
  {
    id: "mint-breeze",
    name: "Mint Breeze",
    from: "#e3f5ee",
    to: "#cdeee5",
    angle: 135,
  },
  {
    id: "lavender-haze",
    name: "Lavender Haze",
    from: "#ece6fb",
    to: "#d9d2f7",
    angle: 120,
  },
  {
    id: "sunrise",
    name: "Sunrise",
    from: "#fff1d6",
    to: "#fbd6cf",
    angle: 125,
  },
  { id: "cloud", name: "Cloud", from: "#f5f7fa", to: "#dfe6ef", angle: 180 },
];

export interface ColourPreset {
  id: string;
  name: string;
  colour: string;
}

export const COLOUR_PRESETS: readonly ColourPreset[] = [
  { id: "midnight", name: "Midnight", colour: "#11111b" },
  { id: "slate", name: "Slate", colour: "#1e1e2e" },
  { id: "graphite", name: "Graphite", colour: "#2b2d31" },
  { id: "deep-ocean", name: "Deep Ocean", colour: "#0f2a3f" },
  { id: "forest", name: "Forest", colour: "#1b2e24" },
  { id: "plum", name: "Plum", colour: "#2e1a33" },
  { id: "paper", name: "Paper", colour: "#f7f7f5" },
  { id: "mist", name: "Mist", colour: "#e8ecf2" },
  { id: "sand", name: "Sand", colour: "#f1e9dc" },
  { id: "blush", name: "Blush", colour: "#f6e3e7" },
  { id: "sage", name: "Sage", colour: "#e3ede4" },
  { id: "sky", name: "Sky", colour: "#dceefb" },
];

// Presets show as designed: applying one clears Darken.

export function applyDynamicPreset(
  settings: BackgroundSettings,
  preset: DynamicPreset,
): BackgroundSettings {
  return { ...settings, kind: "dynamic", dynamic: preset.id, dim: 0 };
}

export function applyColourPreset(
  settings: BackgroundSettings,
  preset: ColourPreset,
): BackgroundSettings {
  return { ...settings, kind: "colour", colour: preset.colour, dim: 0 };
}

export function applyPreset(
  settings: BackgroundSettings,
  preset: GradientPreset,
): BackgroundSettings {
  return {
    ...settings,
    kind: "gradient",
    gradient: { from: preset.from, to: preset.to, angle: preset.angle },
    dim: 0,
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

export const colourSwatch = (preset: ColourPreset) => preset.colour;

export const presetSwatch = (preset: GradientPreset) =>
  `linear-gradient(${preset.angle}deg, ${preset.from}, ${preset.to})`;

/** Half dark, half light, so the swatch shows both versions. */
export function dynamicSwatch(preset: DynamicPreset): string {
  const css = (fill: Fill) =>
    fill.type === "colour"
      ? `linear-gradient(${fill.colour}, ${fill.colour})`
      : `linear-gradient(${fill.angle}deg, ${fill.from}, ${fill.to})`;
  return `${css(preset.dark)} left / 50% 100% no-repeat, ${css(preset.light)} right / 50% 100% no-repeat`;
}
