import type { WidgetDisplay } from "@/core/appearance/appearance";
import FontField from "@/ui/FontField";
import { OptionalColourField, RangeField, SelectField } from "@/ui/fields";

import { WEIGHT_OPTIONS } from "./AppearanceSettings";

interface Props {
  display: WidgetDisplay;
  pageColour: string;
  onChange: (display: WidgetDisplay) => void;
}

/** Per-widget overrides; anything unset follows the page appearance. */
export default function WidgetStyleSettings({
  display,
  pageColour,
  onChange,
}: Props) {
  const set = (patch: Partial<WidgetDisplay>) => {
    const next: WidgetDisplay = { ...display, ...patch };
    // Drop cleared overrides so they inherit again
    for (const key of Object.keys(next) as (keyof WidgetDisplay)[])
      if (next[key] === undefined || next[key] === "" || next[key] === 0)
        delete next[key];
    onChange(next);
  };
  const hasOverrides = Object.keys(display).length > 0;

  return (
    <details className="settings-details">
      <summary>Style {hasOverrides && "(customised)"}</summary>
      <FontField
        value={display.fontFamily ?? ""}
        defaultLabel="Same as page"
        onChange={(fontFamily) => set({ fontFamily })}
      />
      <SelectField
        label="Weight"
        value={String(display.fontWeight ?? 0)}
        options={[
          { value: "0", label: "Same as page" },
          ...WEIGHT_OPTIONS.slice(1),
        ]}
        onChange={(weight) => set({ fontWeight: Number(weight) })}
      />
      <RangeField
        label="Size"
        unit="%"
        min={50}
        max={300}
        step={5}
        value={display.scale ?? 100}
        onChange={(scale) => set({ scale: scale === 100 ? undefined : scale })}
      />
      <OptionalColourField
        label="Colour"
        value={display.colour}
        fallback={pageColour}
        onChange={(colour) => set({ colour })}
      />
      {hasOverrides && (
        <button type="button" className="button" onClick={() => onChange({})}>
          Reset widget style
        </button>
      )}
    </details>
  );
}
