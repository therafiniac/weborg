import { ImageUp, Trash2 } from "lucide-react";
import { useId, useRef, useState } from "react";

import {
  deleteBackgroundImage,
  saveBackgroundImage,
  validateImage,
  type ImageVariant,
} from "@/core/background/imageStore";
import { CheckboxField } from "@/ui/fields";

import type { BackgroundSettingsProps } from "./types";

export default function ImageSettings({
  settings,
  onChange,
}: BackgroundSettingsProps) {
  const fitId = useId();
  const { image } = settings;

  const setImage = (patch: Partial<typeof image>) =>
    onChange({ ...settings, image: { ...image, ...patch } });

  return (
    <>
      <ImagePicker
        label={image.perTheme ? "Dark theme image" : undefined}
        variant="dark"
        hasImage={image.updatedAt !== null}
        onSaved={() => setImage({ updatedAt: Date.now() })}
        onRemoved={() => setImage({ updatedAt: null })}
      />

      <CheckboxField
        label="Use a different image for the light theme"
        checked={image.perTheme}
        onChange={(perTheme) => setImage({ perTheme })}
      />

      {image.perTheme && (
        <ImagePicker
          label="Light theme image"
          variant="light"
          hasImage={image.lightUpdatedAt !== null}
          hint="Shown in the light theme. Until you add one, the dark theme image is used."
          onSaved={() => setImage({ lightUpdatedAt: Date.now() })}
          onRemoved={() => setImage({ lightUpdatedAt: null })}
        />
      )}

      <div className="field">
        <label htmlFor={fitId}>Fit</label>
        <select
          id={fitId}
          value={image.fit}
          onChange={(event) =>
            setImage({ fit: event.target.value as "cover" | "contain" })
          }
        >
          <option value="cover">Fill screen</option>
          <option value="contain">Show whole image</option>
        </select>
      </div>
    </>
  );
}

function ImagePicker({
  label,
  variant,
  hasImage,
  hint = "Up to 15 MB. Stays on this device and is not synced.",
  onSaved,
  onRemoved,
}: {
  label?: string;
  variant: ImageVariant;
  hasImage: boolean;
  hint?: string;
  onSaved: () => void;
  onRemoved: () => void;
}) {
  const labelId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const name = label ? ` ${label.toLowerCase()}` : " image";

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const problem = validateImage(file);
    setError(problem);
    if (problem) return;

    setBusy(true);
    try {
      await saveBackgroundImage(file, variant);
      onSaved();
    } catch (cause) {
      console.error("Weborg: failed to save background image", cause);
      setError("Could not save the image. Please try again.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    try {
      await deleteBackgroundImage(variant);
    } catch (cause) {
      console.error("Weborg: failed to delete background image", cause);
    }
    onRemoved();
  };

  return (
    <div
      className="field"
      role="group"
      aria-labelledby={label ? labelId : undefined}
    >
      {label && <span id={labelId}>{label}</span>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="visually-hidden"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          type="button"
          className="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          <ImageUp size={16} aria-hidden />
          {hasImage ? `Replace${name}` : `Choose${name}`}
        </button>
        {hasImage && (
          <button
            type="button"
            className="button button--danger"
            aria-label={`Remove${name}`}
            onClick={() => void handleRemove()}
          >
            <Trash2 size={16} aria-hidden /> Remove
          </button>
        )}
      </div>
      {error && (
        <p className="hint" role="alert">
          {error}
        </p>
      )}
      {!hasImage && !error && <p className="hint">{hint}</p>}
    </div>
  );
}
