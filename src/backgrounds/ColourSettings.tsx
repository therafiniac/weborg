import { useId } from "react";

import type { BackgroundSettingsProps } from "./types";

export default function ColourSettings({
  settings,
  onChange,
}: BackgroundSettingsProps) {
  const id = useId();
  return (
    <div className="field field--inline">
      <label htmlFor={id}>Colour</label>
      <input
        id={id}
        type="color"
        value={settings.colour}
        onChange={(event) =>
          onChange({ ...settings, colour: event.target.value })
        }
      />
    </div>
  );
}
