import { ImageUp, Trash2 } from "lucide-react";
import { useId, useRef, useState } from "react";

import {
  deleteBackgroundImage,
  saveBackgroundImage,
  validateImage,
} from "@/core/background/imageStore";

import type { BackgroundSettingsProps } from "./types";

export default function ImageSettings({
  settings,
  onChange,
}: BackgroundSettingsProps) {
  const fitId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const hasImage = settings.image.updatedAt !== null;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const problem = validateImage(file);
    setError(problem);
    if (problem) return;

    setBusy(true);
    try {
      await saveBackgroundImage(file);
      onChange({
        ...settings,
        image: { ...settings.image, updatedAt: Date.now() },
      });
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
      await deleteBackgroundImage();
    } catch (cause) {
      console.error("Weborg: failed to delete background image", cause);
    }
    onChange({ ...settings, image: { ...settings.image, updatedAt: null } });
  };

  return (
    <>
      <div className="field">
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
            {hasImage ? "Replace image" : "Choose image"}
          </button>
          {hasImage && (
            <button
              type="button"
              className="button button--danger"
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
        {!hasImage && !error && (
          <p className="hint">
            Up to 15 MB. Stays on this device and is not synced.
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor={fitId}>Fit</label>
        <select
          id={fitId}
          value={settings.image.fit}
          onChange={(event) =>
            onChange({
              ...settings,
              image: {
                ...settings.image,
                fit: event.target.value as "cover" | "contain",
              },
            })
          }
        >
          <option value="cover">Fill screen</option>
          <option value="contain">Show whole image</option>
        </select>
      </div>
    </>
  );
}
