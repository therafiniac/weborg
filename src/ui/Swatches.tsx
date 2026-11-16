import { Check } from "lucide-react";
import { useId } from "react";

export interface Swatch {
  id: string;
  name: string;
  /** CSS background for the preview. */
  background: string;
  active: boolean;
}

interface Props {
  label: string;
  swatches: readonly Swatch[];
  onSelect: (id: string) => void;
  hint?: string;
}

export default function Swatches({ label, swatches, onSelect, hint }: Props) {
  const id = useId();
  return (
    <div className="field">
      <span id={id}>{label}</span>
      <div className="preset-swatches" role="group" aria-labelledby={id}>
        {swatches.map((swatch) => (
          <button
            key={swatch.id}
            type="button"
            className="preset-swatch"
            style={{ background: swatch.background }}
            aria-pressed={swatch.active}
            aria-label={swatch.name}
            title={swatch.name}
            onClick={() => onSelect(swatch.id)}
          >
            {swatch.active && <Check size={16} aria-hidden />}
          </button>
        ))}
      </div>
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}
