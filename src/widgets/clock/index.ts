import type { HourCycle } from "@/core/time/format";
import { defineWidget } from "@/core/widgets/types";

import Clock from "./Clock";
import ClockSettings from "./ClockSettings";

export interface ClockData {
  hourCycle: HourCycle;
  showSeconds: boolean;
  showDate: boolean;
  /** IANA zone, "" = this device's zone. */
  timeZone: string;
}

export const clockWidget = defineWidget<ClockData>({
  type: "clock",
  name: "Clock",
  description: "The current time and date.",
  defaultData: {
    hourCycle: "auto",
    showSeconds: false,
    showDate: true,
    timeZone: "",
  },
  dataVersion: 1,
  Component: Clock,
  Settings: ClockSettings,
});
