import { buildSearchUrl, customUrlError } from "./engines";

describe("search engines", () => {
  it("builds encoded URLs for built-in engines", () => {
    expect(buildSearchUrl("duckduckgo", "", "  cats & dogs ")).toBe(
      "https://duckduckgo.com/?q=cats%20%26%20dogs",
    );
    expect(buildSearchUrl("google", "", "a+b")).toBe(
      "https://www.google.com/search?q=a%2Bb",
    );
  });

  it("does nothing for empty queries", () => {
    expect(buildSearchUrl("google", "", "   ")).toBeNull();
  });

  it("uses a valid custom URL", () => {
    expect(
      buildSearchUrl("custom", "https://example.com/s?q={query}", "x y"),
    ).toBe("https://example.com/s?q=x%20y");
  });

  it("rejects unsafe or malformed custom URLs", () => {
    expect(customUrlError("https://example.com/s?q=")).toMatch(/\{query\}/);
    expect(customUrlError("javascript:alert({query})")).toMatch(/http/);
    expect(customUrlError("example.com/{query}")).toMatch(/full address/);
    expect(buildSearchUrl("custom", "javascript:{query}", "x")).toBeNull();
  });
});
