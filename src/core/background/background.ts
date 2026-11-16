import type { CSSProperties } from "react";
import { storage } from "wxt/utils/storage";

import { isRecord } from "@/core/storage/guards";

export const BACKGROUND_KINDS = ["colour", "gradient", "image"] as const;
export type BackgroundKind = (typeof BACKGROUND_KINDS)[number];

/** Every kind's options are kept, so switching back restores them. */
export interface BackgroundSettings {
  kind: BackgroundKind;
  colour: string;
  gradient: { from: string; to: string; angle: number };
  image: { fit: "cover" | "contain"; updatedAt: number | null };
  /** px, 0-20 */
  blur: number;
  /** percent darkening, 0-80 */
  dim: number;
}

export const defaultBackground: BackgroundSettings = {
  kind: "gradient",
  colour: "#1e1e2e",
  gradient: { from: "#1e1e2e", to: "#45305e", angle: 135 },
  image: { fit: "cover", updatedAt: null },
  blur: 0,
  dim: 0,
};

/** Local only: images and display options are per device. */
export const backgroundItem = storage.defineItem<BackgroundSettings>(
  "local:background",
  { fallback: defaultBackground, version: 1 },
);

export function normalizeBackground(value: unknown): BackgroundSettings {
  if (!isRecord(value)) return defaultBackground;
  const d = defaultBackground;
  return {
    kind: (BACKGROUND_KINDS as readonly unknown[]).includes(value.kind)
      ? (value.kind as BackgroundKind)
      : d.kind,
    colour: typeof value.colour === "string" ? value.colour : d.colour,
    gradient: {
      ...d.gradient,
      ...(isRecord(value.gradient) ? value.gradient : {}),
    },
    image: { ...d.image, ...(isRecord(value.image) ? value.image : {}) },
    blur: clamp(value.blur, 0, 20, d.blur),
    dim: clamp(value.dim, 0, 80, d.dim),
  };
}

/** Style for the background layer (blur applies here, dim is an overlay). */
export function backgroundLayerStyle(
  settings: BackgroundSettings,
  imageUrl: string | null,
): CSSProperties {
  const style: CSSProperties = { backgroundColor: settings.colour };

  if (settings.kind === "gradient") {
    const { from, to, angle } = settings.gradient;
    style.backgroundImage = `linear-gradient(${angle}deg, ${from}, ${to})`;
  } else if (settings.kind === "image" && imageUrl) {
    style.backgroundImage = `url("${imageUrl}")`;
    style.backgroundSize = settings.image.fit;
    style.backgroundPosition = "center";
    style.backgroundRepeat = "no-repeat";
  }

  if (settings.blur > 0) {
    style.filter = `blur(${settings.blur}px)`;
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
