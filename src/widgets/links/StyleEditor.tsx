import {
  CheckboxField,
  ColourField,
  RangeField,
  SelectField,
} from "@/ui/fields";

import { PRESETS, type LinkStyle } from "./style";

interface Props {
  style: LinkStyle;
  onChange: (style: LinkStyle) => void;
}

export default function StyleEditor({ style, onChange }: Props) {
  const set = (patch: Partial<LinkStyle>) => onChange({ ...style, ...patch });

  return (
    <>
      <div className="preset-buttons">
        <span>Presets:</span>
        <button
          type="button"
          className="button"
          onClick={() => onChange(PRESETS.glass)}
        >
          Glass
        </button>
        <button
          type="button"
          className="button"
          onClick={() => onChange(PRESETS.plain)}
        >
          Plain
        </button>
      </div>

      <SelectField<LinkStyle["mode"]>
        label="Style"
        value={style.mode}
        options={[
          { value: "tiles", label: "Tiles" },
          { value: "plain", label: "Plain text" },
        ]}
        onChange={(mode) => set({ mode })}
      />
      <CheckboxField
        label="Show names"
        checked={style.showNames}
        onChange={(showNames) => set({ showNames })}
      />

      <details className="settings-details">
        <summary>Text and icons</summary>
        <ColourField
          label="Text colour"
          value={style.textColour}
          onChange={(textColour) => set({ textColour })}
        />
        <RangeField
          label="Text size"
          unit="px"
          min={10}
          max={32}
          value={style.fontSize}
          onChange={(fontSize) => set({ fontSize })}
        />
        <RangeField
          label="Text weight"
          min={300}
          max={800}
          step={100}
          value={style.fontWeight}
          onChange={(fontWeight) => set({ fontWeight })}
        />
        <RangeField
          label="Icon size"
          unit="px"
          min={12}
          max={64}
          value={style.iconSize}
          onChange={(iconSize) => set({ iconSize })}
        />
        <RangeField
          label="Gap"
          unit="px"
          min={0}
          max={80}
          value={style.gap}
          onChange={(gap) => set({ gap })}
        />
      </details>

      {style.mode === "tiles" && (
        <details className="settings-details">
          <summary>Tiles</summary>
          <>
            <RangeField
              label="Tile width"
              unit="px"
              min={40}
              max={320}
              value={style.tileWidth}
              onChange={(tileWidth) => set({ tileWidth })}
            />
            <RangeField
              label="Tile height"
              unit="px"
              min={32}
              max={200}
              value={style.tileHeight}
              onChange={(tileHeight) => set({ tileHeight })}
            />
            <ColourField
              label="Background"
              value={style.background}
              onChange={(background) => set({ background })}
            />
            <RangeField
              label="Background opacity"
              unit="%"
              min={0}
              max={100}
              value={style.backgroundOpacity}
              onChange={(backgroundOpacity) => set({ backgroundOpacity })}
            />
            <RangeField
              label="Glass blur"
              unit="px"
              min={0}
              max={40}
              value={style.blur}
              onChange={(blur) => set({ blur })}
            />
            <RangeField
              label="Corner radius"
              unit="px"
              min={0}
              max={60}
              value={style.radius}
              onChange={(radius) => set({ radius })}
            />
            <ColourField
              label="Border colour"
              value={style.borderColour}
              onChange={(borderColour) => set({ borderColour })}
            />
            <RangeField
              label="Border opacity"
              unit="%"
              min={0}
              max={100}
              value={style.borderOpacity}
              onChange={(borderOpacity) => set({ borderOpacity })}
            />
            <RangeField
              label="Shadow"
              unit="%"
              min={0}
              max={100}
              value={style.shadow}
              onChange={(shadow) => set({ shadow })}
            />
          </>
        </details>
      )}

      <details className="settings-details">
        <summary>Hover effects</summary>
        <ColourField
          label="Accent colour"
          value={style.accent}
          onChange={(accent) => set({ accent })}
        />
        <CheckboxField
          label="Lift on hover"
          checked={style.hoverLift}
          onChange={(hoverLift) => set({ hoverLift })}
        />
        {style.mode === "tiles" && (
          <>
            <CheckboxField
              label="Glowing border on hover"
              checked={style.hoverGlow}
              onChange={(hoverGlow) => set({ hoverGlow })}
            />
            <CheckboxField
              label="Shine on hover"
              checked={style.hoverShine}
              onChange={(hoverShine) => set({ hoverShine })}
            />
          </>
        )}
      </details>
    </>
  );
}
