import { backdropFor, contrast, darken, luminance } from "./tone";

describe("background tone", () => {
  it("measures luminance and contrast like WCAG", () => {
    expect(luminance("#ffffff")).toBeCloseTo(1);
    expect(luminance("#000000")).toBe(0);
    expect(contrast("#ffffff", "#000000")).toBeCloseTo(21);
  });

  it("puts white text on dark backgrounds and dark text on light ones", () => {
    expect(backdropFor(["#1e1e2e"])).toBe("dark");
    expect(backdropFor(["#f4f4f5"])).toBe("light");
  });

  it("judges a gradient by its harder end", () => {
    // Mostly light, but white text would fail on the pale end
    expect(backdropFor(["#7a6a9a", "#f2eefa"])).toBe("light");
  });

  it("counts the Darken overlay", () => {
    expect(darken("#ffffff", 50)).toBe("#808080");
    expect(backdropFor(["#e8ecf2"])).toBe("light");
    expect(backdropFor(["#e8ecf2"], 80)).toBe("dark");
  });
});
