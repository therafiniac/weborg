import type { Position } from "@/core/layout/positions";
import { createId } from "@/core/storage/ids";
import type { Settings, WidgetInstance } from "@/core/storage/settings";

/** Pure settings updates; callers persist the result. */

export function addWidget(
  settings: Settings,
  type: string,
  position: Position = "middle-centre",
): { settings: Settings; id: string } {
  const id = createId();
  const order =
    settings.widgets.reduce((max, widget) => Math.max(max, widget.order), -1) +
    1;
  return {
    id,
    settings: {
      ...settings,
      widgets: [
        ...settings.widgets,
        { id, type, position, order, display: {} },
      ],
    },
  };
}

export function removeWidget(settings: Settings, id: string): Settings {
  return {
    ...settings,
    widgets: settings.widgets.filter((widget) => widget.id !== id),
  };
}

export function updateWidget(
  settings: Settings,
  id: string,
  patch: Partial<Pick<WidgetInstance, "position" | "display">>,
): Settings {
  return {
    ...settings,
    widgets: settings.widgets.map((widget) =>
      widget.id === id ? { ...widget, ...patch } : widget,
    ),
  };
}

/** Move a widget one step earlier (-1) or later (1) and renumber orders. */
export function moveWidget(
  settings: Settings,
  id: string,
  direction: -1 | 1,
): Settings {
  const sorted = sortWidgets(settings.widgets);
  const from = sorted.findIndex((widget) => widget.id === id);
  const to = from + direction;
  if (from === -1 || to < 0 || to >= sorted.length) return settings;

  const [moved] = sorted.splice(from, 1);
  sorted.splice(to, 0, moved!);
  return {
    ...settings,
    widgets: sorted.map((widget, order) => ({ ...widget, order })),
  };
}

export function sortWidgets(widgets: readonly WidgetInstance[]) {
  return [...widgets].sort((a, b) => a.order - b.order);
}
