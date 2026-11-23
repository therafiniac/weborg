import { defaultBackground, fillColours } from "./background";
import {
  applyColourPreset,
  applyDynamicPreset,
  applyPreset,
  COLOUR_PRESETS,
  DYNAMIC_PRESETS,
  GRADIENT_PRESETS,
  isColourPresetActive,
  isPresetActive,
} from "./presets";
import { backdropFor, contrast, DARK_TEXT, LIGHT_TEXT } from "./tone";

/** The text Weborg picks must reach WCAG AA (4.5:1) on every colour shown. */
function expectReadable(colours: string[]) {
  const text = backdropFor(colours) === "dark" ? LIGHT_TEXT : DARK_TEXT;
  for (const colour of colours)
    expect(contrast(text, colour)).toBeGreaterThanOrEqual(4.5);
}

describe("background presets", () => {
  it.each(GRADIENT_PRESETS.map((p) => [p.name, p] as const))(
    "gradient %s gets readable text",
    (_name, preset) => expectReadable([preset.from, preset.to]),
  );

  it.each(COLOUR_PRESETS.map((p) => [p.name, p] as const))(
    "colour %s gets readable text",
    (_name, preset) => expectReadable([preset.colour]),
  );

  it.each(DYNAMIC_PRESETS.map((p) => [p.name, p] as const))(
    "dynamic %s gets readable text in both themes, dark then light",
    (_name, preset) => {
      expectReadable(fillColours(preset.dark));
      expectReadable(fillColours(preset.light));
      expect(backdropFor(fillColours(preset.dark))).toBe("dark");
      expect(backdropFor(fillColours(preset.light))).toBe("light");
    },
  );

  it("offers both light and dark colours and gradients", () => {
    const tones = (lists: string[][]) =>
      new Set(lists.map((c) => backdropFor(c)));
    expect(tones(COLOUR_PRESETS.map((p) => [p.colour]))).toEqual(
      new Set(["dark", "light"]),
    );
    expect(tones(GRADIENT_PRESETS.map((p) => [p.from, p.to]))).toEqual(
      new Set(["dark", "light"]),
    );
  });

  it("has unique ids and lowercase hex colours", () => {
    for (const list of [GRADIENT_PRESETS, COLOUR_PRESETS, DYNAMIC_PRESETS]) {
      const ids = list.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
    for (const p of GRADIENT_PRESETS) {
      expect(p.from).toMatch(/^#[\da-f]{6}$/);
      expect(p.to).toMatch(/^#[\da-f]{6}$/);
    }
    for (const p of COLOUR_PRESETS) expect(p.colour).toMatch(/^#[\da-f]{6}$/);
  });

  it("applies presets as designed, clearing Darken", () => {
    const darkened = { ...defaultBackground, dim: 40 };
    const gradient = applyPreset(darkened, GRADIENT_PRESETS[6]!);
    expect(gradient.kind).toBe("gradient");
    expect(gradient.dim).toBe(0);
    expect(isPresetActive(gradient, GRADIENT_PRESETS[6]!)).toBe(true);

    const colour = applyColourPreset(darkened, COLOUR_PRESETS[7]!);
    expect(colour).toMatchObject({ kind: "colour", dim: 0 });
    expect(isColourPresetActive(colour, COLOUR_PRESETS[7]!)).toBe(true);

    const dynamic = applyDynamicPreset(darkened, DYNAMIC_PRESETS[2]!);
    expect(dynamic).toMatchObject({
      kind: "dynamic",
      dynamic: DYNAMIC_PRESETS[2]!.id,
      dim: 0,
    });
  });
});
