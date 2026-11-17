import { defaultAppearance } from "@/core/appearance/appearance";
import type { Settings } from "@/core/storage/settings";

import { addWidget, moveWidget, removeWidget, updateWidget } from "./actions";

const settings: Settings = {
  appearance: defaultAppearance,
  ui: { locked: false, widgetsHidden: false },
  widgets: [
    { id: "a", type: "text", position: "top-left", order: 0, display: {} },
    { id: "b", type: "text", position: "top-left", order: 1, display: {} },
    { id: "c", type: "text", position: "middle-centre", order: 2, display: {} },
  ],
};

const ids = (s: Settings) =>
  [...s.widgets].sort((x, y) => x.order - y.order).map((w) => w.id);

describe("widget actions", () => {
  it("adds a widget at the end with a new id", () => {
    const result = addWidget(settings, "clock", "top-right");
    expect(result.settings.widgets).toHaveLength(4);
    expect(result.settings.widgets[3]).toMatchObject({
      id: result.id,
      type: "clock",
      position: "top-right",
      order: 3,
    });
  });

  it("removes a widget", () => {
    expect(ids(removeWidget(settings, "b"))).toEqual(["a", "c"]);
  });

  it("updates position without touching others", () => {
    const next = updateWidget(settings, "a", { position: "bottom-left" });
    expect(next.widgets[0]?.position).toBe("bottom-left");
    expect(next.widgets[1]).toBe(settings.widgets[1]);
  });

  it("moves widgets and renumbers order", () => {
    expect(ids(moveWidget(settings, "c", -1))).toEqual(["a", "c", "b"]);
    expect(ids(moveWidget(settings, "a", 1))).toEqual(["b", "a", "c"]);
  });

  it("ignores moves past either end or unknown ids", () => {
    expect(moveWidget(settings, "a", -1)).toBe(settings);
    expect(moveWidget(settings, "c", 1)).toBe(settings);
    expect(moveWidget(settings, "zzz", 1)).toBe(settings);
  });
});
