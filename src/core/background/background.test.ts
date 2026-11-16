import {
  backgroundLayerStyle,
  defaultBackground,
  normalizeBackground,
} from "./background";
import { validateImage } from "./imageStore";

describe("background", () => {
  it("normalises invalid data to defaults and clamps ranges", () => {
    expect(normalizeBackground(null)).toEqual(defaultBackground);
    const bg = normalizeBackground({ kind: "video", blur: 99, dim: -5 });
    expect(bg.kind).toBe("gradient");
    expect(bg.blur).toBe(20);
    expect(bg.dim).toBe(0);
  });

  it("keeps partial nested options", () => {
    const bg = normalizeBackground({ gradient: { angle: 45 } });
    expect(bg.gradient).toEqual({ ...defaultBackground.gradient, angle: 45 });
  });

  it("builds layer styles per kind", () => {
    expect(
      backgroundLayerStyle({ ...defaultBackground, kind: "colour" }, null),
    ).toEqual({ backgroundColor: "#1e1e2e" });

    expect(backgroundLayerStyle(defaultBackground, null).backgroundImage).toBe(
      "linear-gradient(135deg, #1e1e2e, #45305e)",
    );

    const image = backgroundLayerStyle(
      { ...defaultBackground, kind: "image", blur: 4 },
      "blob:abc",
    );
    expect(image.backgroundImage).toBe('url("blob:abc")');
    expect(image.backgroundSize).toBe("cover");
    expect(image.filter).toBe("blur(4px)");
  });

  it("falls back to the colour when an image is missing", () => {
    expect(
      backgroundLayerStyle({ ...defaultBackground, kind: "image" }, null),
    ).toEqual({ backgroundColor: "#1e1e2e" });
  });

  it("validates uploaded images", () => {
    const file = (type: string, size: number) =>
      new File([new Uint8Array(size)], "f", { type });
    expect(validateImage(file("image/png", 10))).toBeNull();
    expect(validateImage(file("text/plain", 10))).toMatch(/image file/);
    expect(validateImage(file("image/png", 16 * 1024 * 1024))).toMatch(/15 MB/);
  });
});
