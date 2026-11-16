import { useEffect, useState } from "react";

export type Precision = "second" | "minute";

/** Milliseconds until the next whole second or minute. */
export function msUntilNextTick(date: Date, precision: Precision): number {
  const ms = date.getMilliseconds();
  return precision === "second"
    ? 1000 - ms
    : 60_000 - date.getSeconds() * 1000 - ms;
}

/**
 * Current time, re-rendering on each whole second or minute. Also refreshes
 * when the tab becomes visible, since browsers throttle hidden-tab timers.
 */
export function useTime(precision: Precision = "second"): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const schedule = () => {
      timer = setTimeout(
        () => {
          setNow(new Date());
          schedule();
        },
        msUntilNextTick(new Date(), precision),
      );
    };

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      clearTimeout(timer);
      setNow(new Date());
      schedule();
    };

    schedule();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [precision]);

  return now;
}
