import type { WidgetSettingsProps } from "@/core/widgets/types";
import { RangeField } from "@/ui/fields";

import type { NotesData } from ".";

export default function NotesSettings({
  data,
  setData,
}: WidgetSettingsProps<NotesData>) {
  return (
    <>
      <RangeField
        label="Width"
        unit="px"
        min={200}
        max={800}
        step={20}
        value={data.width}
        onChange={(width) => setData({ ...data, width })}
      />
      <RangeField
        label="Height"
        unit=" lines"
        min={3}
        max={30}
        value={data.rows}
        onChange={(rows) => setData({ ...data, rows })}
      />
    </>
  );
}
