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
      lightUpdatedAt: null,
    });
  });

  it("defaults to a dynamic preset that follows the theme", () => {
    const mist = getDynamicPreset("mist")!;
    expect(resolveBackground(defaultBackground, "dark")).toEqual(mist.dark);
    expect(resolveBackground(defaultBackground, "light")).toEqual(mist.light);
  });

  it("shows the light image in the light theme only when there is one", () => {
    const image = {
      fit: "cover" as const,
      updatedAt: 1,
      perTheme: true,
      lightUpdatedAt: 2,
    };
    const bg = { ...defaultBackground, kind: "image" as const, image };
    expect(resolveBackground(bg, "dark")).toEqual({
      type: "image",
      variant: "dark",
      version: 1,
    });
    expect(resolveBackground(bg, "light")).toEqual({
      type: "image",
      variant: "light",
      version: 2,
    });
    const noLight = { ...bg, image: { ...image, lightUpdatedAt: null } };
    expect(resolveBackground(noLight, "light")).toMatchObject({
      variant: "dark",
    });
    const noImages = {
      ...bg,
      image: { ...image, updatedAt: null, lightUpdatedAt: null },
    };
    expect(resolveBackground(noImages, "dark")).toEqual({
      type: "colour",
      colour: bg.colour,
    });
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
      { type: "image", variant: "dark", version: 1 },
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
        { type: "image", variant: "dark", version: 1 },
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
