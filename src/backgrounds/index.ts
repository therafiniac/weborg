import type { BackgroundKind } from "@/core/background/background";

import ColourSettings from "./ColourSettings";
import GradientSettings from "./GradientSettings";
import ImageSettings from "./ImageSettings";
import type { BackgroundDefinition } from "./types";

/** The only list of background types. Add new ones here. */
export const backgrounds: readonly BackgroundDefinition[] = [
  { kind: "colour", name: "Colour", Settings: ColourSettings },
  { kind: "gradient", name: "Gradient", Settings: GradientSettings },
  { kind: "image", name: "Image", Settings: ImageSettings },
];

export const getBackground = (kind: BackgroundKind) =>
  backgrounds.find((background) => background.kind === kind);
