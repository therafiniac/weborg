import { storage } from "wxt/utils/storage";

import { isPosition, type Position } from "@/core/layout/positions";

/** Per-widget style overrides (controls arrive in Phase 3). */
export interface WidgetDisplay {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  colour?: string;
}

export interface WidgetInstance {
  id: string;
  /** Widget type from the registry, e.g. "text". */
  type: string;
  position: Position;
  order: number;
  display: WidgetDisplay;
}

export interface Settings {
  widgets: WidgetInstance[];
}

export const SETTINGS_VERSION = 1;

export const defaultSettings: Settings = {
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
});

/**
 * Return a fully valid Settings object from anything stored or imported.
 * Invalid widget entries are dropped rather than crashing the page.
 */
export function normalizeSettings(value: unknown): Settings {
  if (!isRecord(value) || !Array.isArray(value.widgets)) return defaultSettings;

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
        display: isRecord(widget.display)
          ? (widget.display as WidgetDisplay)
          : {},
      },
    ];
  });

  return { widgets };
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
