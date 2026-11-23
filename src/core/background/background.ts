import type { CSSProperties } from "react";
import { storage } from "wxt/utils/storage";

import { isRecord } from "@/core/storage/guards";

import { DEFAULT_DYNAMIC, getDynamicPreset } from "./presets";

/** "dynamic": a preset with a dark and a light version, following the theme. */
export const BACKGROUND_KINDS = [
  "dynamic",
  "colour",
  "gradient",
  "image",
] as const;
export type BackgroundKind = (typeof BACKGROUND_KINDS)[number];

export type Theme = "dark" | "light";

/** A solid colour or a gradient; what presets and dynamic variants hold. */
export type Fill =
  | { type: "colour"; colour: string }
  | { type: "gradient"; from: string; to: string; angle: number };

export interface BackgroundImage {
  fit: "cover" | "contain";
  /** When the (dark, or only) image was saved; null when there is none. */
  updatedAt: number | null;
  /** A second image for the light theme. */
  perTheme: boolean;
  lightUpdatedAt: number | null;
}

/** Every kind's options are kept, so switching back restores them. */
export interface BackgroundSettings {
  kind: BackgroundKind;
  /** Dynamic preset id. */
  dynamic: string;
  colour: string;
  gradient: { from: string; to: string; angle: number };
  image: BackgroundImage;
  /** px, 0-20 */
  blur: number;
  /** percent darkening, 0-80 */
  dim: number;
}

export const defaultBackground: BackgroundSettings = {
  kind: "dynamic",
  dynamic: DEFAULT_DYNAMIC,
  colour: "#1e1e2e",
  gradient: { from: "#1e1e2e", to: "#45305e", angle: 135 },
  image: {
    fit: "cover",
    updatedAt: null,
    perTheme: false,
    lightUpdatedAt: null,
  },
  blur: 0,
  dim: 0,
};

/** The default before themes: a dark gradient that ignored the theme. */
const OLD_DEFAULT_GRADIENT = { from: "#1e1e2e", to: "#45305e" };

/** v2: an untouched old default becomes the theme-following default. */
export function migrateBackgroundV2(old: unknown): unknown {
  if (!isRecord(old) || !isRecord(old.gradient)) return old;
  const untouched =
    old.kind === "gradient" &&
    old.gradient.from === OLD_DEFAULT_GRADIENT.from &&
    old.gradient.to === OLD_DEFAULT_GRADIENT.to &&
    !old.dim;
  return untouched
    ? { ...old, kind: "dynamic", dynamic: DEFAULT_DYNAMIC }
    : old;
}

/** Local only: images and display options are per device. */
export const backgroundItem = storage.defineItem<BackgroundSettings>(
  "local:background",
  {
    fallback: defaultBackground,
    version: 2,
    migrations: { 2: migrateBackgroundV2 },
  },
);

export function normalizeBackground(value: unknown): BackgroundSettings {
  if (!isRecord(value)) return defaultBackground;
  const d = defaultBackground;
  const image = isRecord(value.image) ? value.image : {};
  return {
    kind: (BACKGROUND_KINDS as readonly unknown[]).includes(value.kind)
      ? (value.kind as BackgroundKind)
      : d.kind,
    dynamic:
      typeof value.dynamic === "string" && getDynamicPreset(value.dynamic)
        ? value.dynamic
        : d.dynamic,
    colour: typeof value.colour === "string" ? value.colour : d.colour,
    gradient: {
      ...d.gradient,
      ...(isRecord(value.gradient) ? value.gradient : {}),
    },
    image: {
      fit: image.fit === "contain" ? "contain" : "cover",
      updatedAt: typeof image.updatedAt === "number" ? image.updatedAt : null,
      perTheme: image.perTheme === true,
      lightUpdatedAt:
        typeof image.lightUpdatedAt === "number" ? image.lightUpdatedAt : null,
    },
    blur: clamp(value.blur, 0, 20, d.blur),
    dim: clamp(value.dim, 0, 80, d.dim),
  };
}

/** What is actually drawn for a theme. */
export type ResolvedBackground =
  | Fill
  | {
      type: "image";
      /** Which stored image to show. */
      variant: Theme;
      /** Changes when that image is replaced, to reload it. */
      version: number;
    };

export function resolveBackground(
  settings: BackgroundSettings,
  theme: Theme,
): ResolvedBackground {
  switch (settings.kind) {
    case "dynamic": {
      const preset =
        getDynamicPreset(settings.dynamic) ??
        getDynamicPreset(DEFAULT_DYNAMIC)!;
      return preset[theme];
    }
    case "colour":
      return { type: "colour", colour: settings.colour };
    case "gradient":
      return { type: "gradient", ...settings.gradient };
    case "image": {
      const { updatedAt, perTheme, lightUpdatedAt } = settings.image;
      // The light image only when asked for and present; else the main one
      if (theme === "light" && perTheme && lightUpdatedAt !== null)
        return { type: "image", variant: "light", version: lightUpdatedAt };
      if (updatedAt !== null)
        return { type: "image", variant: "dark", version: updatedAt };
      return { type: "colour", colour: settings.colour };
    }
  }
}

/** The colours a fill shows, for judging text contrast. */
export function fillColours(fill: Fill): string[] {
  return fill.type === "colour" ? [fill.colour] : [fill.from, fill.to];
}

export function fillCss(fill: Fill): string {
  return fill.type === "colour"
    ? fill.colour
    : `linear-gradient(${fill.angle}deg, ${fill.from}, ${fill.to})`;
}

/** Style for the background layer (blur applies here, dim is an overlay). */
export function backgroundLayerStyle(
  resolved: ResolvedBackground,
  imageUrl: string | null,
  options: { blur: number; fit: "cover" | "contain"; colour: string },
): CSSProperties {
  const style: CSSProperties = {};

  if (resolved.type === "colour") {
    style.backgroundColor = resolved.colour;
  } else if (resolved.type === "gradient") {
    style.backgroundColor = resolved.from;
    style.backgroundImage = fillCss(resolved);
  } else {
    style.backgroundColor = options.colour;
    if (imageUrl) {
      style.backgroundImage = `url("${imageUrl}")`;
      style.backgroundSize = options.fit;
      style.backgroundPosition = "center";
      style.backgroundRepeat = "no-repeat";
    }
  }

  if (options.blur > 0) {
    style.filter = `blur(${options.blur}px)`;
    // Scale up slightly so blurred edges stay off-screen
    style.transform = "scale(1.08)";
  }

  return style;
}

function clamp(value: unknown, min: number, max: number, fallback: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback;
}
