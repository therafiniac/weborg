import { useId } from "react";

import type { WidgetSettingsProps } from "@/core/widgets/types";

import type { TextData } from ".";

export default function TextSettings({
  data,
  setData,
}: WidgetSettingsProps<TextData>) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>Text</label>
      <textarea
        id={id}
        rows={3}
        value={data.text}
        onChange={(event) => setData({ ...data, text: event.target.value })}
      />
    </div>
  );
}
