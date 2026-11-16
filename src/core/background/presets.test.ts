import { defaultBackground } from "./background";
import {
  applyPreset,
  GRADIENT_PRESETS,
  isPresetActive,
  presetSwatch,
} from "./presets";

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function darken(hex: string, percent: number): string {
  return (
    "#" +
    [1, 3, 5]
      .map((i) =>
        Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - percent / 100))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}

const whiteContrast = (hex: string) => 1.05 / (luminance(hex) + 0.05);

describe("gradient presets", () => {
  it.each(GRADIENT_PRESETS.map((p) => [p.name, p] as const))(
    "%s keeps white text readable (WCAG AA 4.5:1)",
    (_name, preset) => {
      for (const stop of [preset.from, preset.to])
        expect(whiteContrast(darken(stop, preset.dim))).toBeGreaterThanOrEqual(
          4.5,
        );
    },
  );

  it("has unique ids and lowercase hex colours", () => {
    const ids = GRADIENT_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of GRADIENT_PRESETS) {
      expect(p.from).toMatch(/^#[\da-f]{6}$/);
      expect(p.to).toMatch(/^#[\da-f]{6}$/);
    }
  });

  it("the first preset matches the default background", () => {
    expect(isPresetActive(defaultBackground, GRADIENT_PRESETS[0]!)).toBe(true);
  });

  it("applies a preset as a gradient with its darken level", () => {
    const preset = GRADIENT_PRESETS[4]!;
    const next = applyPreset({ ...defaultBackground, kind: "image" }, preset);
    expect(next).toMatchObject({
      kind: "gradient",
      gradient: { from: preset.from, to: preset.to, angle: preset.angle },
      dim: preset.dim,
    });
    expect(isPresetActive(next, preset)).toBe(true);
    expect(presetSwatch(preset)).toContain(`rgb(0 0 0 / ${preset.dim}%)`);
  });
});
