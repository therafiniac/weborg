/**
 * A preview of what Todoist's Quick Add will pick up, for highlighting only.
 * Todoist does the real parsing; this covers the common English forms.
 */

export type TokenKind =
  | "date"
  | "project"
  | "section"
  | "label"
  | "priority"
  | "deadline"
  | "reminder"
  | "description";

export interface Segment {
  text: string;
  kind: TokenKind | null;
}

const DAYS_FULL = "monday|tuesday|wednesday|thursday|friday|saturday|sunday";
// Short forms that are rarely ordinary words
const DAYS_SHORT = "mon|tues|tue|thurs|thur|thu|fri";
const DAYS_ALL = `${DAYS_FULL}|${DAYS_SHORT}|wed|sat|sun`;
const MONTHS =
  "january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|" +
  "august|aug|september|sept|sep|october|oct|november|nov|december|dec";
const ORDINAL = "\\d{1,2}(?:st|nd|rd|th)?";
const UNITS = "min|mins|minutes?|hours?|days?|weeks?|months?|years?";

const TIME =
  "(?:at\\s+)?(?:\\d{1,2}(?::\\d{2})?\\s?(?:am|pm)|\\d{1,2}:\\d{2}|noon|midnight)";

const DATE_CORE = [
  `every\\s+(?:other\\s+)?(?:\\d+\\s+)?(?:${UNITS}|weekday|workday|morning|evening|${DAYS_ALL})`,
  "everyday|daily|weekly|monthly|yearly",
  "today|tod|tonight|tomorrow|tmr|tom",
  "(?:this|next)\\s+(?:week|weekend|month|year)|weekend",
  "end\\s+of\\s+(?:the\\s+)?(?:week|month)",
  `in\\s+\\d+\\s+(?:${UNITS})`,
  `(?:next|this|on)\\s+(?:${DAYS_ALL})`,
  `(?:${MONTHS})\\s+${ORDINAL}(?:,?\\s+\\d{4})?`,
  `${ORDINAL}\\s+(?:${MONTHS})(?:\\s+\\d{4})?`,
  "\\d{4}-\\d{2}-\\d{2}",
  "\\d{1,2}/\\d{1,2}(?:/\\d{2,4})?",
  DAYS_FULL,
  DAYS_SHORT,
].join("|");

const DATE = new RegExp(
  `(?<![\\w#@/])(?:(?:${DATE_CORE})(?:\\s+${TIME})?|${TIME}(?:\\s+(?:${DATE_CORE}))?)(?!\\w)`,
  "i",
);

const PATTERNS: { kind: TokenKind; regex: RegExp; first?: boolean }[] = [
  {
    kind: "priority",
    regex: /(?<!\S)(?:[pP][1-4]|!![1-4])(?!\S)/g,
    first: true,
  },
  { kind: "label", regex: /(?<!\S)@[^\s@#]+/g },
  { kind: "deadline", regex: /\{[^{}]+\}/g },
  { kind: "reminder", regex: /(?<!\S)!(?:\d+\s?[mhd]b?|\d{1,2}:\d{2})(?!\S)/g },
];

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

interface Match {
  start: number;
  end: number;
  kind: TokenKind;
}

function projectMatches(text: string, projectNames: string[]): Match[] {
  // Known names first, longest first, so "#My Project" wins over "#My"
  const names = [...projectNames]
    .filter((name) => name.trim())
    .sort((a, b) => b.length - a.length)
    .map(escape);
  const alternatives = [...names, "(?:\\\\ |[^\\s#@])+"].join("|");
  const regex = new RegExp(`(?<!\\S)#(?:${alternatives})(?=\\s|$)`, "gi");
  const matches: Match[] = [...text.matchAll(regex)].map((m) => ({
    start: m.index,
    end: m.index + m[0].length,
    kind: "project",
  }));
  // Sections only mean something after a project
  const first = matches[0];
  if (first) {
    for (const m of text.slice(first.end).matchAll(/(?<!\S)\/[^\s/]+/g)) {
      const start = first.end + m.index;
      matches.push({ start, end: start + m[0].length, kind: "section" });
    }
  }
  return matches;
}

export function tokenize(text: string, projectNames: string[] = []): Segment[] {
  // A description runs to the end and is not parsed further
  const descriptionAt = text.search(/(?:^|\s)\/\/\s/);
  const body = descriptionAt === -1 ? text : text.slice(0, descriptionAt);

  const matches: Match[] = projectMatches(body, projectNames);
  for (const { kind, regex, first } of PATTERNS) {
    for (const m of body.matchAll(regex)) {
      matches.push({ start: m.index, end: m.index + m[0].length, kind });
      if (first) break;
    }
  }
  // Todoist takes the first date only; skip ones inside other tokens
  let offset = 0;
  while (offset < body.length) {
    const m = DATE.exec(body.slice(offset));
    if (!m) break;
    const start = offset + m.index;
    const end = start + m[0].length;
    if (!matches.some((other) => start < other.end && end > other.start)) {
      matches.push({ start, end, kind: "date" });
      break;
    }
    offset = end;
  }

  matches.sort((a, b) => a.start - b.start || b.end - a.end);
  const segments: Segment[] = [];
  let at = 0;
  for (const match of matches) {
    if (match.start < at) continue; // overlaps an earlier token
    if (match.start > at)
      segments.push({ text: body.slice(at, match.start), kind: null });
    segments.push({
      text: body.slice(match.start, match.end),
      kind: match.kind,
    });
    at = match.end;
  }
  if (at < body.length) segments.push({ text: body.slice(at), kind: null });
  if (descriptionAt !== -1)
    segments.push({ text: text.slice(descriptionAt), kind: "description" });
  return segments;
}

/**
 * Quick Add needs spaces in project names escaped ("#My\ Project").
 * Escape known names typed plainly so they are not cut at the first space.
 */
export function prepareQuickAdd(text: string, projectNames: string[]): string {
  let result = text;
  for (const name of [...projectNames].sort((a, b) => b.length - a.length)) {
    if (!name.includes(" ")) continue;
    result = result.replace(
      new RegExp(`(?<!\\S)#${escape(name)}(?=\\s|$)`, "gi"),
      (match) => match.replace(/ /g, "\\ "),
    );
  }
  return result;
}
