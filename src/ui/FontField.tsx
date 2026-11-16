import { useId, useState } from "react";

import {
  FONT_LABELS,
  FONT_STACKS,
  isPresetFont,
} from "@/core/appearance/fonts";

const CUSTOM = "__custom";

interface Props {
  label?: string;
  /** Preset key, custom font name, or "" for the default. */
  value: string;
  defaultLabel: string;
  onChange: (value: string) => void;
}

/** Font picker: presets plus a custom installed-font name. */
export default function FontField({
  label = "Font",
  value,
  defaultLabel,
  onChange,
}: Props) {
  const selectId = useId();
  const inputId = useId();
  const [custom, setCustom] = useState(!isPresetFont(value));

  return (
    <>
      <div className="field">
        <label htmlFor={selectId}>{label}</label>
        <select
          id={selectId}
          value={custom ? CUSTOM : value}
          onChange={(event) => {
            const next = event.target.value;
            setCustom(next === CUSTOM);
            if (next !== CUSTOM) onChange(next);
          }}
        >
          <option value="">{defaultLabel}</option>
          {Object.keys(FONT_STACKS).map((key) => (
            <option key={key} value={key}>
              {FONT_LABELS[key as keyof typeof FONT_LABELS]}
            </option>
          ))}
          <option value={CUSTOM}>Custom…</option>
        </select>
      </div>
      {custom && (
        <div className="field">
          <label htmlFor={inputId}>Font name (must be installed)</label>
          <input
            id={inputId}
            type="text"
            value={isPresetFont(value) ? "" : value}
            placeholder="e.g. Inter"
            onChange={(event) => onChange(event.target.value)}
          />
        </div>
      )}
    </>
  );
}
