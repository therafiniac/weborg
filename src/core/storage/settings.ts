import { storage } from "wxt/utils/storage";

import {
  defaultAppearance,
  normalizeAppearance,
  normalizeDisplay,
  type Appearance,
  type WidgetDisplay,
} from "@/core/appearance/appearance";
import { isPosition, type Position } from "@/core/layout/positions";

import { isRecord } from "./guards";

export type { WidgetDisplay };
export { isRecord };

export interface WidgetInstance {
  id: string;
  /** Widget type from the registry, e.g. "text". */
  type: string;
  position: Position;
  order: number;
  display: WidgetDisplay;
}

export interface Settings {
  appearance: Appearance;
  widgets: WidgetInstance[];
}

export const SETTINGS_VERSION = 2;

/**
 * Stored-data migrations, keyed by the version they upgrade to. They only
 * fill missing fields and never overwrite existing ones (see linksMigrations
 * for why).
 */
export const settingsMigrations: Record<number, (old: unknown) => unknown> = {
  // v2: global appearance added
  2: (old) => ({
    appearance: defaultAppearance,
    ...(isRecord(old) ? old : {}),
  }),
};

export const defaultSettings: Settings = {
  appearance: defaultAppearance,
  widgets: [
    {
      id: "default-clock",
      type: "clock",
      position: "middle-centre",
      order: 0,
      display: {},
    },
    {
      id: "default-greeting",
      type: "greeting",
      position: "middle-centre",
      order: 1,
      display: {},
    },
    {
      id: "default-search",
      type: "search",
      position: "middle-centre",
      order: 2,
      display: {},
    },
    {
      id: "default-links",
      type: "links",
      position: "middle-centre",
      order: 3,
      display: {},
    },
  ],
};

/** Synced across devices; keep small (see docs/ARCHITECTURE.md section 4). */
export const settingsItem = storage.defineItem<Settings>("sync:settings", {
  fallback: defaultSettings,
  version: SETTINGS_VERSION,
  migrations: settingsMigrations,
});

/**
 * Return a fully valid Settings object from anything stored or imported.
 * Invalid widget entries are dropped rather than crashing the page.
 */
export function normalizeSettings(value: unknown): Settings {
  if (!isRecord(value)) return defaultSettings;
  if (!Array.isArray(value.widgets))
    return {
      ...defaultSettings,
      appearance: normalizeAppearance(value.appearance),
    };

  const widgets = value.widgets.flatMap((widget, index): WidgetInstance[] => {
    if (
      !isRecord(widget) ||
      typeof widget.id !== "string" ||
      typeof widget.type !== "string"
    )
      return [];
    return [
      {
        id: widget.id,
        type: widget.type,
        position: isPosition(widget.position)
          ? widget.position
          : "middle-centre",
        order: typeof widget.order === "number" ? widget.order : index,
        display: normalizeDisplay(widget.display),
      },
    ];
  });

  return { appearance: normalizeAppearance(value.appearance), widgets };
}
