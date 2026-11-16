import { Check, RotateCcw } from "lucide-react";
import { useId } from "react";

import {
  defaultBackground,
  type BackgroundKind,
  type BackgroundSettings as Settings,
} from "@/core/background/background";
import { deleteBackgroundImage } from "@/core/background/imageStore";
import {
  applyPreset,
  GRADIENT_PRESETS,
  isPresetActive,
  presetSwatch,
} from "@/core/background/presets";
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
      <div className="field">
        <span id={`${kindId}-presets`}>Presets</span>
        <div
          className="preset-swatches"
          role="group"
          aria-labelledby={`${kindId}-presets`}
        >
          {GRADIENT_PRESETS.map((preset) => {
            const active = isPresetActive(settings, preset);
            return (
              <button
                key={preset.id}
                type="button"
                className="preset-swatch"
                style={{ background: presetSwatch(preset) }}
                aria-pressed={active}
                aria-label={preset.name}
                title={preset.name}
                onClick={() => onChange(applyPreset(settings, preset))}
              >
                {active && <Check size={16} aria-hidden />}
              </button>
            );
          })}
        </div>
        <span className="hint">Inspired by Catppuccin Mocha.</span>
      </div>

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
