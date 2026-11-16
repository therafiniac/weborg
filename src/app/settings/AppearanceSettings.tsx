import {
  defaultAppearance,
  type Appearance,
  type TextShadow,
} from "@/core/appearance/appearance";
import FontField from "@/ui/FontField";
import { ColourField, RangeField, SelectField } from "@/ui/fields";

export const WEIGHT_OPTIONS = [
  { value: "0", label: "Default" },
  { value: "300", label: "Light" },
  { value: "400", label: "Regular" },
  { value: "500", label: "Medium" },
  { value: "600", label: "Semibold" },
  { value: "700", label: "Bold" },
  { value: "800", label: "Extra bold" },
] as const;

interface Props {
  appearance: Appearance;
  onChange: (appearance: Appearance) => void;
}

export default function AppearanceSettings({ appearance, onChange }: Props) {
  const set = (patch: Partial<Appearance>) =>
    onChange({ ...appearance, ...patch });

  return (
    <>
      <p className="hint">
        Applies to every widget. Each widget can override these in its own
        settings.
      </p>
      <h4 className="settings-subheading">Text</h4>
      <FontField
        value={appearance.fontFamily}
        defaultLabel="System default"
        onChange={(fontFamily) => set({ fontFamily })}
      />
      <SelectField
        label="Weight"
        value={String(appearance.fontWeight)}
        options={WEIGHT_OPTIONS}
        onChange={(weight) => set({ fontWeight: Number(weight) })}
      />
      <ColourField
        label="Text colour"
        value={appearance.textColour}
        onChange={(textColour) => set({ textColour })}
      />
      <SelectField<TextShadow>
        label="Text shadow"
        value={appearance.textShadow}
        options={[
          { value: "none", label: "None" },
          { value: "soft", label: "Soft" },
          { value: "strong", label: "Strong (busy backgrounds)" },
        ]}
        onChange={(textShadow) => set({ textShadow })}
      />
      <RangeField
        label="Text size"
        unit="%"
        min={50}
        max={200}
        step={5}
        value={appearance.textScale}
        onChange={(textScale) => set({ textScale })}
      />
      <h4 className="settings-subheading">Spacing</h4>
      <RangeField
        label="Space from screen edge"
        unit="px"
        min={0}
        max={200}
        step={4}
        value={appearance.edgePadding}
        onChange={(edgePadding) => set({ edgePadding })}
      />
      <RangeField
        label="Space between widgets"
        unit="px"
        min={0}
        max={120}
        step={2}
        value={appearance.widgetSpacing}
        onChange={(widgetSpacing) => set({ widgetSpacing })}
      />
      <button
        type="button"
        className="button"
        onClick={() => onChange(defaultAppearance)}
      >
        Reset appearance
      </button>
    </>
  );
}
