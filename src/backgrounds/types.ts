import type { ComponentType } from "react";

import type {
  BackgroundKind,
  BackgroundSettings,
} from "@/core/background/background";

export interface BackgroundSettingsProps {
  settings: BackgroundSettings;
  onChange: (settings: BackgroundSettings) => void;
}

export interface BackgroundDefinition {
  kind: BackgroundKind;
  name: string;
  Settings: ComponentType<BackgroundSettingsProps>;
}
