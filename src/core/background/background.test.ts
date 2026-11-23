import {
  backgroundLayerStyle,
  defaultBackground,
  migrateBackgroundV2,
  normalizeBackground,
  resolveBackground,
} from "./background";
import { validateImage } from "./imageStore";
import { getDynamicPreset } from "./presets";

const opts = { blur: 0, fit: "cover" as const, colour: "#111111" };

describe("background", () => {
  it("normalises invalid data to defaults and clamps ranges", () => {
    expect(normalizeBackground(null)).toEqual(defaultBackground);
    const bg = normalizeBackground({ kind: "video", blur: 99, dim: -5 });
    expect(bg.kind).toBe("dynamic");
    expect(bg.blur).toBe(20);
    expect(bg.dim).toBe(0);
    expect(normalizeBackground({ dynamic: "nope" }).dynamic).toBe("mist");
  });

  it("keeps partial nested options", () => {
    const bg = normalizeBackground({ gradient: { angle: 45 } });
    expect(bg.gradient).toEqual({ ...defaultBackground.gradient, angle: 45 });
    expect(normalizeBackground({ image: { updatedAt: 5 } }).image).toEqual({
      fit: "cover",
      updatedAt: 5,
      perTheme: false,
      darkUpdatedAt: null,
      lightUpdatedAt: null,
    });
  });

  it("defaults to a dynamic preset that follows the theme", () => {
    const mist = getDynamicPreset("mist")!;
    expect(resolveBackground(defaultBackground, "dark")).toEqual(mist.dark);
    expect(resolveBackground(defaultBackground, "light")).toEqual(mist.light);
  });

  it("uses one main image in both themes by default", () => {
    const bg = {
      ...defaultBackground,
      kind: "image" as const,
      image: { ...defaultBackground.image, updatedAt: 1 },
    };
    for (const theme of ["dark", "light"] as const)
      expect(resolveBackground(bg, theme)).toEqual({
        type: "image",
        variant: "main",
        version: 1,
      });
  });

  it("with separate images, each theme falls back to the other, then main", () => {
    const withImages = (
      darkUpdatedAt: number | null,
      lightUpdatedAt: number | null,
      updatedAt: number | null = null,
    ) => ({
      ...defaultBackground,
      kind: "image" as const,
      image: {
        fit: "cover" as const,
        perTheme: true,
        updatedAt,
        darkUpdatedAt,
        lightUpdatedAt,
      },
    });
    const variant = (
      bg: ReturnType<typeof withImages>,
      theme: "dark" | "light",
    ) => {
      const resolved = resolveBackground(bg, theme);
      return resolved.type === "image" ? resolved.variant : resolved.type;
    };

    expect(variant(withImages(1, 2), "dark")).toBe("dark");
    expect(variant(withImages(1, 2), "light")).toBe("light");
    // Neither slot is primary: a lone light image also shows in dark
    expect(variant(withImages(null, 2), "dark")).toBe("light");
    expect(variant(withImages(1, null), "light")).toBe("dark");
    expect(variant(withImages(null, null, 3), "light")).toBe("main");
    expect(variant(withImages(null, null), "dark")).toBe("colour");
  });

  it("builds layer styles per kind", () => {
    expect(
      backgroundLayerStyle({ type: "colour", colour: "#1e1e2e" }, null, opts),
    ).toEqual({ backgroundColor: "#1e1e2e" });

    expect(
      backgroundLayerStyle(
        { type: "gradient", from: "#1e1e2e", to: "#45305e", angle: 135 },
        null,
        opts,
      ).backgroundImage,
    ).toBe("linear-gradient(135deg, #1e1e2e, #45305e)");

    const image = backgroundLayerStyle(
      { type: "image", variant: "main", version: 1 },
      "blob:abc",
      { ...opts, blur: 4 },
    );
    expect(image.backgroundImage).toBe('url("blob:abc")');
    expect(image.backgroundSize).toBe("cover");
    expect(image.filter).toBe("blur(4px)");
  });

  it("falls back to the colour while an image loads", () => {
    expect(
      backgroundLayerStyle(
        { type: "image", variant: "main", version: 1 },
        null,
        opts,
      ),
    ).toEqual({ backgroundColor: "#111111" });
  });

  it("v2 moves only the untouched old default to the dynamic default", () => {
    const old = {
      kind: "gradient",
      gradient: { from: "#1e1e2e", to: "#45305e", angle: 135 },
      dim: 0,
    };
    expect(migrateBackgroundV2(old)).toMatchObject({
      kind: "dynamic",
      dynamic: "mist",
    });
    const chosen = { ...old, gradient: { ...old.gradient, to: "#ff0000" } };
    expect(migrateBackgroundV2(chosen)).toBe(chosen);
    const darkened = { ...old, dim: 30 };
    expect(migrateBackgroundV2(darkened)).toBe(darkened);
  });

  it("validates uploaded images", () => {
    const file = (type: string, size: number) =>
      new File([new Uint8Array(size)], "f", { type });
    expect(validateImage(file("image/png", 10))).toBeNull();
    expect(validateImage(file("text/plain", 10))).toMatch(/image file/);
  });
});
