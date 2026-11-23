import { useEffect, useState } from "react";

import type { ResolvedTheme } from "@/core/appearance/appearance";
import {
  backgroundLayerStyle,
  themedDefaults,
  type BackgroundSettings,
} from "@/core/background/background";
import { loadBackgroundImage } from "@/core/background/imageStore";

import "./Background.css";

export default function Background({
  settings,
  theme = "dark",
}: {
  settings: BackgroundSettings;
  theme?: ResolvedTheme;
}) {
  const imageUrl = useBackgroundImageUrl(
    settings.kind === "image" ? settings.image.updatedAt : null,
  );

  return (
    <div className="background" aria-hidden>
      <div
        className="background__layer"
        style={backgroundLayerStyle(themedDefaults(settings, theme), imageUrl)}
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

/** Object URL for the stored image; reloads when `version` changes. */
function useBackgroundImageUrl(version: number | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (version === null) return;
    let objectUrl: string | null = null;
    let cancelled = false;

    loadBackgroundImage()
      .then((blob) => {
        if (cancelled || !blob) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch((error: unknown) =>
        console.error("Weborg: failed to load background image", error),
      );

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setUrl(null);
    };
  }, [version]);

  return version === null ? null : url;
}
