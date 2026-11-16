import { formatDate, formatTime } from "@/core/time/format";
import { useTime } from "@/core/time/useTime";
import type { WidgetProps } from "@/core/widgets/types";

import type { ClockData } from ".";
import "./Clock.css";

export default function Clock({ data }: WidgetProps<ClockData>) {
  const now = useTime(data.showSeconds ? "second" : "minute");

  return (
    <div className="clock">
      <time className="clock__time" dateTime={now.toISOString()}>
        {formatTime(now, data)}
      </time>
      {data.showDate && (
        <p className="clock__date">{formatDate(now, data.timeZone)}</p>
      )}
    </div>
  );
}
