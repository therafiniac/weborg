import { useId } from "react";

import type { BackgroundSettingsProps } from "./types";

export default function GradientSettings({
  settings,
  onChange,
}: BackgroundSettingsProps) {
  const fromId = useId();
  const toId = useId();
  const angleId = useId();
  const { gradient } = settings;
  const set = (patch: Partial<typeof gradient>) =>
    onChange({ ...settings, gradient: { ...gradient, ...patch } });

  return (
    <>
      <div className="field field--inline">
        <label htmlFor={fromId}>From</label>
        <input
          id={fromId}
          type="color"
          value={gradient.from}
          onChange={(event) => set({ from: event.target.value })}
        />
      </div>
      <div className="field field--inline">
        <label htmlFor={toId}>To</label>
        <input
          id={toId}
          type="color"
          value={gradient.to}
          onChange={(event) => set({ to: event.target.value })}
        />
      </div>
      <div className="field">
        <label htmlFor={angleId}>Angle: {gradient.angle}°</label>
        <input
          id={angleId}
          type="range"
          min={0}
          max={360}
          step={5}
          value={gradient.angle}
          onChange={(event) => set({ angle: Number(event.target.value) })}
        />
      </div>
    </>
  );
}
