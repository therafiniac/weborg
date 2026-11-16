export const ENGINES = {
  duckduckgo: { name: "DuckDuckGo", url: "https://duckduckgo.com/?q={query}" },
  google: { name: "Google", url: "https://www.google.com/search?q={query}" },
  bing: { name: "Bing", url: "https://www.bing.com/search?q={query}" },
  brave: {
    name: "Brave Search",
    url: "https://search.brave.com/search?q={query}",
  },
  ecosia: { name: "Ecosia", url: "https://www.ecosia.org/search?q={query}" },
  startpage: {
    name: "Startpage",
    url: "https://www.startpage.com/sp/search?query={query}",
  },
} as const;

export type EngineId = keyof typeof ENGINES | "custom";

/** Error message for a custom search URL, or null when it is valid. */
export function customUrlError(url: string): string | null {
  if (!url.includes("{query}"))
    return "Include {query} where the search words should go.";
  try {
    const parsed = new URL(url.replace("{query}", "test"));
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:")
      return "Use an http or https address.";
  } catch {
    return "Enter a full address, e.g. https://example.com/search?q={query}";
  }
  return null;
}

/** Final URL for a query, or null when nothing should happen. */
export function buildSearchUrl(
  engine: EngineId,
  customUrl: string,
  query: string,
): string | null {
  const trimmed = query.trim();
  if (!trimmed) return null;
  const template =
    engine === "custom"
      ? customUrlError(customUrl) === null
        ? customUrl
        : null
      : ENGINES[engine].url;
  return template?.replace("{query}", encodeURIComponent(trimmed)) ?? null;
}

export function engineName(engine: EngineId): string {
  return engine === "custom" ? "custom search" : ENGINES[engine].name;
}
