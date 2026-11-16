export type HourCycle = "auto" | "12" | "24";

export interface TimeFormat {
  hourCycle: HourCycle;
  showSeconds: boolean;
  /** IANA time zone, or "" for the device's zone. */
  timeZone: string;
  locale?: string;
}

/** Undefined when the zone is empty or unknown, so Intl uses the local zone. */
export function safeTimeZone(timeZone: string): string | undefined {
  if (!timeZone) return undefined;
  try {
    new Intl.DateTimeFormat(undefined, { timeZone });
    return timeZone;
  } catch {
    return undefined;
  }
}

export function formatTime(date: Date, format: TimeFormat): string {
  return new Intl.DateTimeFormat(format.locale, {
    hour: "numeric",
    minute: "2-digit",
    second: format.showSeconds ? "2-digit" : undefined,
    hourCycle:
      format.hourCycle === "12"
        ? "h12"
        : format.hourCycle === "24"
          ? "h23"
          : undefined,
    timeZone: safeTimeZone(format.timeZone),
  }).format(date);
}

export function formatDate(
  date: Date,
  timeZone: string,
  locale?: string,
): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: safeTimeZone(timeZone),
  }).format(date);
}

/** Hour (0-23) in the given zone. */
export function hourIn(date: Date, timeZone: string): number {
  const hour = new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    hourCycle: "h23",
    timeZone: safeTimeZone(timeZone),
  }).format(date);
  return Number(hour);
}

export function timeZones(): string[] {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return [];
  }
}
