import { timeZones, type HourCycle } from "@/core/time/format";
import type { WidgetSettingsProps } from "@/core/widgets/types";
import { CheckboxField, SelectField } from "@/ui/fields";

import type { ClockData } from ".";

const zoneOptions = [
  { value: "", label: "This device's time zone" },
  ...timeZones().map((zone) => ({
    value: zone,
    label: zone.replaceAll("_", " "),
  })),
];

export default function ClockSettings({
  data,
  setData,
}: WidgetSettingsProps<ClockData>) {
  return (
    <>
      <SelectField<HourCycle>
        label="Hour format"
        value={data.hourCycle}
        options={[
          { value: "auto", label: "Automatic (from your language)" },
          { value: "12", label: "12-hour" },
          { value: "24", label: "24-hour" },
        ]}
        onChange={(hourCycle) => setData({ ...data, hourCycle })}
      />
      <SelectField
        label="Time zone"
        value={data.timeZone}
        options={zoneOptions}
        onChange={(timeZone) => setData({ ...data, timeZone })}
      />
      <CheckboxField
        label="Show seconds"
        checked={data.showSeconds}
        onChange={(showSeconds) => setData({ ...data, showSeconds })}
      />
      <CheckboxField
        label="Show date"
        checked={data.showDate}
        onChange={(showDate) => setData({ ...data, showDate })}
      />
    </>
  );
}
