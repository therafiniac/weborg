import type { CSSProperties } from "react";

import { isRecord } from "@/core/storage/guards";

import { fontFamilyCss } from "./fonts";

export const TEXT_SHADOWS = {
  none: undefined,
  soft: "0 1px 3px rgb(0 0 0 / 0.45)",
  strong: "0 2px 8px rgb(0 0 0 / 0.75), 0 0 2px rgb(0 0 0 / 0.6)",
} as const;

export type TextShadow = keyof typeof TEXT_SHADOWS;

/** Global look for every widget (layer 2 in docs/ARCHITECTURE.md §6). */
export interface Appearance {
  /** Font preset key or custom font name; "" = system default. */
  fontFamily: string;
  /** 0 = each widget's own weight. */
  fontWeight: number;
  textColour: string;
  textShadow: TextShadow;
  /** Percent, 50-200. Scales all widget text. */
  textScale: number;
  /** px between widgets and the screen edge. */
  edgePadding: number;
  /** px between widgets in the same position. */
  widgetSpacing: number;
}

export const defaultAppearance: Appearance = {
  fontFamily: "",
  fontWeight: 0,
  textColour: "#ffffff",
  textShadow: "soft",
  textScale: 100,
  edgePadding: 24,
  widgetSpacing: 16,
};

/** Per-widget overrides (layer 3). Unset fields use the global appearance. */
export interface WidgetDisplay {
  fontFamily?: string;
  fontWeight?: number;
  /** Percent of the global text size, 50-300. */
  scale?: number;
  colour?: string;
}

export function normalizeAppearance(value: unknown): Appearance {
  if (!isRecord(value)) return defaultAppearance;
  const d = defaultAppearance;
  return {
    fontFamily: str(value.fontFamily, d.fontFamily),
    fontWeight: num(value.fontWeight, 0, 900, d.fontWeight),
    textColour: colour(value.textColour) ?? d.textColour,
    textShadow: Object.hasOwn(TEXT_SHADOWS, String(value.textShadow))
      ? (value.textShadow as TextShadow)
      : d.textShadow,
    textScale: num(value.textScale, 50, 200, d.textScale),
    edgePadding: num(value.edgePadding, 0, 200, d.edgePadding),
    widgetSpacing: num(value.widgetSpacing, 0, 120, d.widgetSpacing),
  };
}

export function normalizeDisplay(value: unknown): WidgetDisplay {
  if (!isRecord(value)) return {};
  const display: WidgetDisplay = {};
  if (typeof value.fontFamily === "string" && value.fontFamily.trim())
    display.fontFamily = value.fontFamily;
  if (typeof value.fontWeight === "number")
    display.fontWeight = num(value.fontWeight, 100, 900, 400);
  if (typeof value.scale === "number")
    display.scale = num(value.scale, 50, 300, 100);
  const c = colour(value.colour);
  if (c) display.colour = c;
  return display;
}

/** Variables on the dashboard root. */
export function appearanceVars(appearance: Appearance): CSSProperties {
  const vars: Record<string, string> = {
    "--dashboard-text": appearance.textColour,
    "--dashboard-scale": String(appearance.textScale / 100),
    "--edge-padding": `${appearance.edgePadding}px`,
    "--widget-spacing": `${appearance.widgetSpacing}px`,
  };
  const font = fontFamilyCss(appearance.fontFamily);
  if (font) vars["--dashboard-font"] = font;
  if (appearance.fontWeight)
    vars["--dashboard-weight"] = String(appearance.fontWeight);
  const shadow = TEXT_SHADOWS[appearance.textShadow];
  if (shadow) vars["--dashboard-shadow"] = shadow;
  return vars as CSSProperties;
}

/** Variables on one widget's wrapper; only overrides that are set. */
export function displayVars(display: WidgetDisplay): CSSProperties {
  const vars: Record<string, string> = {};
  const font = display.fontFamily
    ? fontFamilyCss(display.fontFamily)
    : undefined;
  if (font) vars["--widget-font"] = font;
  if (display.fontWeight) vars["--widget-weight"] = String(display.fontWeight);
  if (display.scale) vars["--widget-scale"] = String(display.scale / 100);
  if (display.colour) vars["--widget-colour"] = display.colour;
  return vars as CSSProperties;
}

function str(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function num(value: unknown, min: number, max: number, fallback: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback;
}

function colour(value: unknown): string | undefined {
  return typeof value === "string" && /^#[\da-f]{6}$/i.test(value)
    ? value
    : undefined;
}
