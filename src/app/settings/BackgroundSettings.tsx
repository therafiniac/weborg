import { useId } from "react";

import {
  type BackgroundKind,
  type BackgroundSettings as Settings,
} from "@/core/background/background";
import { backgrounds, getBackground } from "@/backgrounds";

interface Props {
  settings: Settings;
  onChange: (settings: Settings) => void;
}

export default function BackgroundSettings({ settings, onChange }: Props) {
  const kindId = useId();
  const blurId = useId();
  const dimId = useId();
  const definition = getBackground(settings.kind);

  return (
    <>
      <div className="field">
        <label htmlFor={kindId}>Type</label>
        <select
          id={kindId}
          value={settings.kind}
          onChange={(event) =>
            onChange({
              ...settings,
              kind: event.target.value as BackgroundKind,
            })
          }
        >
          {backgrounds.map((background) => (
            <option key={background.kind} value={background.kind}>
              {background.name}
            </option>
          ))}
        </select>
      </div>

      {definition && (
        <definition.Settings settings={settings} onChange={onChange} />
      )}

      <div className="field">
        <label htmlFor={blurId}>Blur: {settings.blur}px</label>
        <input
          id={blurId}
          type="range"
          min={0}
          max={20}
          value={settings.blur}
          onChange={(event) =>
            onChange({ ...settings, blur: Number(event.target.value) })
          }
        />
      </div>

      <div className="field">
        <label htmlFor={dimId}>Darken: {settings.dim}%</label>
        <input
          id={dimId}
          type="range"
          min={0}
          max={80}
          step={5}
          value={settings.dim}
          onChange={(event) =>
            onChange({ ...settings, dim: Number(event.target.value) })
          }
        />
      </div>
    </>
  );
}
