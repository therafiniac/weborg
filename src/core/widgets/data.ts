import { storage, type WxtStorageItem } from "wxt/utils/storage";

import { useStorageItem } from "@/core/storage/useStorageItem";

import type { WidgetDefinition } from "./types";

type DataItem = WxtStorageItem<object, Record<string, unknown>>;

const items = new Map<string, DataItem>();

export const widgetDataKey = (id: string) => `local:widget:${id}` as const;

/** One storage item per widget instance, kept local (not synced). */
export function widgetDataItem(
  id: string,
  definition: WidgetDefinition,
): DataItem {
  const key = widgetDataKey(id);
  let item = items.get(key);
  if (!item) {
    item = storage.defineItem<object>(key, {
      fallback: definition.defaultData,
      version: definition.dataVersion,
      migrations: definition.migrations,
    });
    items.set(key, item);
  }
  return item;
}

export async function removeWidgetData(id: string): Promise<void> {
  items.delete(widgetDataKey(id));
  await storage.removeItem(widgetDataKey(id), { removeMeta: true });
}

/** Widget data merged over defaults, so new fields always have a value. */
export function useWidgetData<Data extends object>(
  id: string,
  definition: WidgetDefinition<Data>,
): [Data | undefined, (data: Data) => void] {
  const item = widgetDataItem(id, definition as unknown as WidgetDefinition);
  const [stored, setStored] = useStorageItem(item);
  const data =
    stored === undefined
      ? undefined
      : ({ ...definition.defaultData, ...stored } as Data);
  const setData = (next: Data) => {
    setStored(next).catch((error: unknown) =>
      console.error("Weborg: failed to save widget data", error),
    );
  };
  return [data, setData];
}
