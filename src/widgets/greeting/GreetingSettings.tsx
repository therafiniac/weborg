import type { WidgetSettingsProps } from "@/core/widgets/types";
import { TextField } from "@/ui/fields";

import type { GreetingData } from ".";

export default function GreetingSettings({
  data,
  setData,
}: WidgetSettingsProps<GreetingData>) {
  return (
    <TextField
      label="Your name (optional)"
      value={data.name}
      onChange={(name) => setData({ ...data, name })}
    />
  );
}
