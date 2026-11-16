import type { WidgetDefinition } from "@/core/widgets/types";

import { textWidget } from "./text";

/**
 * The only list of available widgets. Add new widgets here.
 * The cast erases each widget's Data type; WidgetHost pairs data with its own definition.
 */
export const widgets: readonly WidgetDefinition[] = [
  textWidget as unknown as WidgetDefinition,
];

export function getWidget(type: string): WidgetDefinition | undefined {
  return widgets.find((widget) => widget.type === type);
}
