import {
  defaultAppearance,
  type Appearance,
  type TextShadow,
  type ThemeChoice,
} from "@/core/appearance/appearance";
import FontField from "@/ui/FontField";
import { OptionalColourField, RangeField, SelectField } from "@/ui/fields";
import SegmentedControl from "@/ui/SegmentedControl";

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
      <h4 className="settings-subheading">Theme</h4>
      <div className="field">
        <SegmentedControl<ThemeChoice>
          label="Theme"
          value={appearance.theme}
          options={[
            { value: "system", label: "System" },
            { value: "dark", label: "Dark" },
            { value: "light", label: "Light" },
          ]}
          onChange={(theme) => set({ theme })}
        />
      </div>
      <p className="hint">
        System follows your computer's light or dark setting. The sun/moon
        button in the bottom-right corner switches quickly.
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
      <OptionalColourField
        label="Text colour"
        // Unset: follows the theme (white in dark, near-black in light)
        value={appearance.textColourAuto ? undefined : appearance.textColour}
        fallback={appearance.textColour}
        onChange={(textColour) =>
          textColour
            ? set({ textColour, textColourAuto: false })
            : set({ textColourAuto: true })
        }
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
