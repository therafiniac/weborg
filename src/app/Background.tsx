import { useEffect, useState } from "react";

import type { ResolvedTheme } from "@/core/appearance/appearance";
import {
  backgroundLayerStyle,
  fillColours,
  resolveBackground,
  type BackgroundSettings,
} from "@/core/background/background";
import {
  loadBackgroundImage,
  type ImageVariant,
} from "@/core/background/imageStore";
import { averageColour, backdropFor } from "@/core/background/tone";

import "./Background.css";

export default function Background({
  settings,
  theme = "dark",
}: {
  settings: BackgroundSettings;
  theme?: ResolvedTheme;
}) {
  const resolved = resolveBackground(settings, theme);
  const image = resolved.type === "image" ? resolved : null;
  const { url, colour } = useBackgroundImage(
    image?.variant ?? null,
    image?.version ?? null,
  );

  // Text on the background follows its brightness (Darken included).
  // Until an image is measured, assume dark, the safer guess for photos.
  const backdrop =
    resolved.type === "image"
      ? colour
        ? backdropFor([colour], settings.dim)
        : "dark"
      : backdropFor(fillColours(resolved), settings.dim);

  useEffect(() => {
    document.documentElement.dataset.backdrop = backdrop;
  }, [backdrop]);

  return (
    <div className="background" aria-hidden>
      <div
        className="background__layer"
        style={backgroundLayerStyle(resolved, url, {
          blur: settings.blur,
          fit: settings.image.fit,
          colour: settings.colour,
        })}
      />
      {settings.dim > 0 && (
        <div
          className="background__dim"
          style={{ backgroundColor: `rgb(0 0 0 / ${settings.dim}%)` }}
        />
      )}
    </div>
  );
}

/** Object URL and average colour of a stored image; reloads on `version`. */
function useBackgroundImage(
  variant: ImageVariant | null,
  version: number | null,
): { url: string | null; colour: string | null } {
  const [loaded, setLoaded] = useState<{
    key: string;
    url: string;
    colour: string | null;
  } | null>(null);
  const key = variant && version !== null ? `${variant}:${version}` : null;

  useEffect(() => {
    if (!variant || version === null) return;
    let objectUrl: string | null = null;
    let cancelled = false;

    loadBackgroundImage(variant)
      .then(async (blob) => {
        if (cancelled || !blob) return;
        objectUrl = URL.createObjectURL(blob);
        const colour = await averageColour(blob);
        if (!cancelled)
          setLoaded({ key: `${variant}:${version}`, url: objectUrl, colour });
      })
      .catch((error: unknown) =>
        console.error("Weborg: failed to load background image", error),
      );

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [variant, version]);

  return loaded && loaded.key === key
    ? { url: loaded.url, colour: loaded.colour }
    : { url: null, colour: null };
}
