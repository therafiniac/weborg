import { formatDate, formatTime, hourIn, safeTimeZone } from "./format";
import { msUntilNextTick } from "./useTime";

// 2026-03-04 15:07:09.250 UTC
const date = new Date(Date.UTC(2026, 2, 4, 15, 7, 9, 250));

describe("time formatting", () => {
  it("formats 24-hour time with and without seconds", () => {
    const base = { hourCycle: "24", timeZone: "UTC", locale: "en-GB" } as const;
    expect(formatTime(date, { ...base, showSeconds: false })).toBe("15:07");
    expect(formatTime(date, { ...base, showSeconds: true })).toBe("15:07:09");
  });

  it("formats 12-hour time", () => {
    expect(
      formatTime(date, {
        hourCycle: "12",
        showSeconds: false,
        timeZone: "UTC",
        locale: "en-US",
      }),
    ).toMatch(/^3:07\sPM$/);
  });

  it("respects time zones", () => {
    expect(
      formatTime(date, {
        hourCycle: "24",
        showSeconds: false,
        timeZone: "Asia/Kolkata",
        locale: "en-GB",
      }),
    ).toBe("20:37");
    expect(hourIn(date, "Asia/Kolkata")).toBe(20);
  });

  it("formats the date", () => {
    expect(formatDate(date, "UTC", "en-GB")).toBe("Wednesday 4 March");
  });

  it("ignores unknown time zones", () => {
    expect(safeTimeZone("Mars/Base")).toBeUndefined();
    expect(safeTimeZone("")).toBeUndefined();
    expect(safeTimeZone("Europe/Paris")).toBe("Europe/Paris");
  });

  it("schedules the next tick on the boundary", () => {
    expect(msUntilNextTick(date, "second")).toBe(750);
    expect(msUntilNextTick(date, "minute")).toBe(50_750);
  });
});
