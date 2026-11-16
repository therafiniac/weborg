import { defaultAppearance } from "@/core/appearance/appearance";

import { defaultSettings, normalizeSettings } from "./settings";

describe("normalizeSettings()", () => {
  it("falls back to defaults for missing or invalid data", () => {
    expect(normalizeSettings(undefined)).toEqual(defaultSettings);
    expect(normalizeSettings({ widgets: "nope" })).toEqual(defaultSettings);
  });

  it("drops invalid widgets and repairs missing fields", () => {
    expect(
      normalizeSettings({
        widgets: [
          { id: "a", type: "text", position: "nowhere" },
          { type: "text" },
          "junk",
        ],
      }),
    ).toEqual({
      appearance: defaultAppearance,
      ui: { locked: false, widgetsHidden: false },
      widgets: [
        {
          id: "a",
          type: "text",
          position: "middle-centre",
          order: 0,
          display: {},
        },
      ],
    });
  });

  it("keeps valid widgets unchanged", () => {
    expect(normalizeSettings(defaultSettings)).toEqual(defaultSettings);
  });
});
