/**
 * Turn user input into a safe link URL, or null.
 * Adds https:// when no scheme is given; only http and https are allowed,
 * so javascript: and data: URLs can never be rendered as links.
 */
export function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(trimmed);
  const looksLikeHostPort = /^[^/:]+:\d+(\/|$)/.test(trimmed);
  const candidate =
    hasScheme && !looksLikeHostPort ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    const host = url.hostname;
    if (!host || (!host.includes(".") && host !== "localhost")) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** The text shown for a link: its name, or its domain. */
export function linkLabel(link: { name: string; url: string }): string {
  return link.name.trim() || hostname(link.url) || "Untitled";
}
