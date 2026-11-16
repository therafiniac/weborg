import type { ComponentType } from "react";

import type { WidgetInstance } from "@/core/storage/settings";

export interface WidgetProps<Data> {
  instance: WidgetInstance;
  data: Data;
  setData: (data: Data) => void;
}

export type WidgetSettingsProps<Data> = WidgetProps<Data>;

/** Contract every widget module implements (docs/ARCHITECTURE.md section 5). */
export interface WidgetDefinition<Data extends object = object> {
  /** Unique and stable: stored in settings. Never rename. */
  type: string;
  name: string;
  description: string;
  defaultData: Data;
  /** Bump with a migration whenever the shape of Data changes. */
  dataVersion: number;
  migrations?: Record<number, (old: unknown) => unknown>;
  Component: ComponentType<WidgetProps<Data>>;
  Settings?: ComponentType<WidgetSettingsProps<Data>>;
}

/** Helper that keeps Data typed while registering widgets in one list. */
export function defineWidget<Data extends object>(
  definition: WidgetDefinition<Data>,
): WidgetDefinition<Data> {
  return definition;
}
