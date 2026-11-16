import type { WidgetDefinition } from "@/core/widgets/types";

import { clockWidget } from "./clock";
import { greetingWidget } from "./greeting";
import { linksWidget } from "./links";
import { notesWidget } from "./notes";
import { searchWidget } from "./search";
import { textWidget } from "./text";

/**
 * The only list of available widgets. Add new widgets here.
 * The cast erases each widget's Data type; WidgetHost pairs data with its own definition.
 */
export const widgets = [
  clockWidget,
  greetingWidget,
  searchWidget,
  linksWidget,
  notesWidget,
  textWidget,
].map((widget) => widget as unknown as WidgetDefinition);

export function getWidget(type: string): WidgetDefinition | undefined {
  return widgets.find((widget) => widget.type === type);
}
