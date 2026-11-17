import { RotateCcw } from "lucide-react";

import { getBackground } from "@/backgrounds";
import {
  defaultBackground,
  type BackgroundKind,
  type BackgroundSettings as Settings,
} from "@/core/background/background";
import { deleteBackgroundImage } from "@/core/background/imageStore";
import {
  applyColourPreset,
  applyPreset,
  COLOUR_PRESETS,
  colourSwatch,
  GRADIENT_PRESETS,
  isColourPresetActive,
  isPresetActive,
  presetSwatch,
} from "@/core/background/presets";
import { RangeField } from "@/ui/fields";
import SegmentedControl from "@/ui/SegmentedControl";
import Swatches from "@/ui/Swatches";

interface Props {
  settings: Settings;
  onChange: (settings: Settings) => void;
}

export default function BackgroundSettings({ settings, onChange }: Props) {
  const definition = getBackground(settings.kind);

  const handleReset = async () => {
    const hasImage = settings.image.updatedAt !== null;
    if (
      hasImage &&
      !confirm("Reset the background? Your uploaded image will be removed.")
    )
      return;
    if (hasImage)
      await deleteBackgroundImage().catch((error: unknown) =>
        console.error("Weborg: failed to delete background image", error),
      );
    onChange(defaultBackground);
  };

  return (
    <>
      <SegmentedControl<BackgroundKind>
        label="Background type"
        value={settings.kind}
        options={[
          { value: "colour", label: "Colour" },
          { value: "gradient", label: "Gradient" },
          { value: "image", label: "Image" },
        ]}
        onChange={(kind) => onChange({ ...settings, kind })}
      />

      {settings.kind === "colour" && (
        <Swatches
          label="Presets"
          swatches={COLOUR_PRESETS.map((preset) => ({
            id: preset.id,
            name: preset.name,
            background: colourSwatch(preset),
            active: isColourPresetActive(settings, preset),
          }))}
          onSelect={(id) => {
            const preset = COLOUR_PRESETS.find((p) => p.id === id);
            if (preset) onChange(applyColourPreset(settings, preset));
          }}
        />
      )}

      {settings.kind === "gradient" && (
        <Swatches
          label="Presets"
          swatches={GRADIENT_PRESETS.map((preset) => ({
            id: preset.id,
            name: preset.name,
            background: presetSwatch(preset),
            active: isPresetActive(settings, preset),
          }))}
          onSelect={(id) => {
            const preset = GRADIENT_PRESETS.find((p) => p.id === id);
            if (preset) onChange(applyPreset(settings, preset));
          }}
        />
      )}

      {/* Images have no presets: upload and fit are the main controls */}
      {settings.kind === "image" && definition && (
        <definition.Settings settings={settings} onChange={onChange} />
      )}

      {settings.kind !== "image" && definition && (
        <details className="settings-details">
          <summary>Fine-tune colours</summary>
          <definition.Settings settings={settings} onChange={onChange} />
        </details>
      )}

      <h4 className="settings-subheading">Effects</h4>
      <RangeField
        label="Blur"
        unit="px"
        min={0}
        max={20}
        value={settings.blur}
        onChange={(blur) => onChange({ ...settings, blur })}
      />
      <RangeField
        label="Darken"
        unit="%"
        min={0}
        max={80}
        step={5}
        value={settings.dim}
        onChange={(dim) => onChange({ ...settings, dim })}
      />

      <button
        type="button"
        className="button"
        onClick={() => void handleReset()}
      >
        <RotateCcw size={16} aria-hidden /> Reset background
      </button>
    </>
  );
}
