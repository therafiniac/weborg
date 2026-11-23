import { storage } from "wxt/utils/storage";

import {
  backgroundItem,
  normalizeBackground,
  type BackgroundSettings,
} from "@/core/background/background";
import { deleteBackgroundImage } from "@/core/background/imageStore";
import { widgetDataKey } from "@/core/widgets/data";

import {
  isRecord,
  normalizeSettings,
  settingsItem,
  type Settings,
} from "./settings";

export const BACKUP_FORMAT = "weborg";
export const BACKUP_VERSION = 1;
export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;

export interface Backup {
  format: typeof BACKUP_FORMAT;
  formatVersion: number;
  exportedAt: string;
  settings: Settings;
  /** The image itself is not included; it stays on the device. */
  background: BackgroundSettings;
  /** Widget data keyed by widget instance id. */
  widgets: Record<string, unknown>;
}

export class BackupError extends Error {}

export async function createBackup(): Promise<Backup> {
  const settings = normalizeSettings(await settingsItem.getValue());
  const background = normalizeBackground(await backgroundItem.getValue());

  const widgets: Record<string, unknown> = {};
  for (const widget of settings.widgets) {
    const data = await storage.getItem(widgetDataKey(widget.id));
    if (data !== null) widgets[widget.id] = data;
  }

  return {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    settings,
    background: {
      ...background,
      image: {
        ...background.image,
        updatedAt: null,
        darkUpdatedAt: null,
        lightUpdatedAt: null,
      },
    },
    widgets,
  };
}

/** Parse and validate a backup file's text. Throws BackupError. */
export function parseBackup(text: string): Backup {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new BackupError("This file is not valid JSON.");
  }

  if (!isRecord(value) || value.format !== BACKUP_FORMAT)
    throw new BackupError("This file is not a Weborg backup.");
  if (typeof value.formatVersion !== "number")
    throw new BackupError("This backup is missing its version.");
  if (value.formatVersion > BACKUP_VERSION)
    throw new BackupError(
      "This backup comes from a newer version of Weborg. Please update first.",
    );

  const settings = normalizeSettings(value.settings);
  const ids = new Set(settings.widgets.map((widget) => widget.id));
  const widgets = Object.fromEntries(
    Object.entries(isRecord(value.widgets) ? value.widgets : {}).filter(
      ([id]) => ids.has(id),
    ),
  );

  return {
    format: BACKUP_FORMAT,
    formatVersion: value.formatVersion,
    exportedAt: typeof value.exportedAt === "string" ? value.exportedAt : "",
    settings,
    background: normalizeBackground(value.background),
    widgets,
  };
}

/** Delete everything Weborg stores on this device and in sync. */
export async function resetAll(): Promise<void> {
  await Promise.all([storage.clear("local"), storage.clear("sync")]);
  await deleteBackgroundImage().catch(() => {
    // No image or IndexedDB unavailable: nothing to delete
  });
}

/** Replace all current data with a parsed backup. */
export async function restoreBackup(backup: Backup): Promise<void> {
  await resetAll();
  await Promise.all([
    settingsItem.setValue(backup.settings),
    backgroundItem.setValue(backup.background),
    ...Object.entries(backup.widgets).map(([id, data]) =>
      storage.setItem(widgetDataKey(id), data),
    ),
  ]);
}
