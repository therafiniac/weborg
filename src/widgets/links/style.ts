import type { CSSProperties } from "react";

export interface LinkStyle {
  /** "plain": text links. "tiles": styled cards. */
  mode: "plain" | "tiles";
  tileWidth: number;
  tileHeight: number;
  gap: number;
  background: string;
  /** 0-100 */
  backgroundOpacity: number;
  blur: number;
  radius: number;
  borderColour: string;
  /** 0-100 */
  borderOpacity: number;
  /** 0-100 */
  shadow: number;
  textColour: string;
  fontSize: number;
  fontWeight: number;
  iconSize: number;
  showNames: boolean;
  accent: string;
  hoverLift: boolean;
  hoverGlow: boolean;
  hoverShine: boolean;
}

export const glassPreset: LinkStyle = {
  mode: "tiles",
  tileWidth: 128,
  tileHeight: 48,
  gap: 16,
  background: "#1e1e2e",
  backgroundOpacity: 70,
  blur: 12,
  radius: 16,
  borderColour: "#cdd6f4",
  borderOpacity: 16,
  shadow: 50,
  textColour: "#cdd6f4",
  fontSize: 13,
  fontWeight: 600,
  iconSize: 18,
  showNames: true,
  accent: "#cba6f7",
  hoverLift: true,
  hoverGlow: true,
  hoverShine: true,
};

export const plainPreset: LinkStyle = {
  ...glassPreset,
  mode: "plain",
  fontSize: 15,
  fontWeight: 500,
  textColour: "#ffffff",
  hoverGlow: false,
  hoverShine: false,
};

export const PRESETS = { plain: plainPreset, glass: glassPreset } as const;

/** Fill in fields missing from older saved data. */
export const resolveStyle = (style?: Partial<LinkStyle>): LinkStyle => ({
  ...glassPreset,
  ...style,
});

export function hexToRgba(hex: string, alpha: number): string {
  let value = hex.trim().replace(/^#/, "");
  if (value.length === 3) value = value.replace(/./g, (c) => c + c);
  const a = round(Math.min(1, Math.max(0, alpha)));
  if (!/^[\da-f]{6}$/i.test(value)) return `rgba(0, 0, 0, ${a})`;
  const n = parseInt(value, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

/** CSS variables read by Links.css. */
export function styleVars(style: LinkStyle, columns: number): CSSProperties {
  const bg = style.backgroundOpacity / 100;
  const shadow = style.shadow / 50;
  return {
    "--links-columns": String(Math.max(1, Math.round(columns))),
    "--links-tile-width": `${style.tileWidth}px`,
    "--links-tile-height": `${style.tileHeight}px`,
    "--links-gap": `${style.gap}px`,
    // Tabs layout: tabs and panel share a lighter glass so tiles stand out
    "--links-panel-bg": hexToRgba(style.background, bg * 0.55),
    "--links-bg": `linear-gradient(145deg, ${hexToRgba(style.background, bg)}, ${hexToRgba(style.background, bg * 0.75)})`,
    "--links-blur": `${style.blur}px`,
    "--links-radius": `${style.radius}px`,
    "--links-border": hexToRgba(style.borderColour, style.borderOpacity / 100),
    "--links-shadow": `0 4px 12px rgba(0, 0, 0, ${round(0.35 * shadow)}), 0 10px 24px rgba(0, 0, 0, ${round(0.25 * shadow)})`,
    "--links-text": style.textColour,
    "--links-font-size": `${style.fontSize}px`,
    "--links-font-weight": String(style.fontWeight),
    "--links-icon-size": `${style.iconSize}px`,
    "--links-accent": style.accent,
    "--links-hover-bg": `linear-gradient(145deg, ${hexToRgba(style.accent, 0.22)}, ${hexToRgba(style.accent, 0.1)})`,
    "--links-hover-shadow": `0 10px 28px ${hexToRgba(style.accent, 0.3)}`,
  } as CSSProperties;
}

export function styleClasses(style: LinkStyle): string {
  return [
    "links",
    `links--${style.mode}`,
    style.hoverLift && "links--lift",
    style.mode === "tiles" && style.hoverGlow && "links--glow",
    style.mode === "tiles" && style.hoverShine && "links--shine",
    !style.showNames && "links--icons-only",
  ]
    .filter(Boolean)
    .join(" ");
}

function round(n: number) {
  return Math.round(n * 1000) / 1000;
}
