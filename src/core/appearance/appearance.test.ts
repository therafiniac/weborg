import { settingsMigrations, normalizeSettings } from "@/core/storage/settings";

import {
  appearanceVars,
  defaultAppearance,
  displayVars,
  normalizeAppearance,
  normalizeDisplay,
} from "./appearance";
import { fontFamilyCss } from "./fonts";

describe("appearance", () => {
  it("normalises invalid values to safe defaults", () => {
    expect(normalizeAppearance(undefined)).toEqual(defaultAppearance);
    const a = normalizeAppearance({
      textColour: "red; background: url(x)",
      textShadow: "huge",
      textScale: 999,
      edgePadding: -4,
    });
    expect(a.textColour).toBe("#ffffff");
    expect(a.textShadow).toBe("soft");
    expect(a.textScale).toBe(200);
    expect(a.edgePadding).toBe(0);
  });

  it("only keeps valid widget overrides", () => {
    expect(
      normalizeDisplay({ colour: "#ABCDEF", scale: 1000, fontFamily: " " }),
    ).toEqual({ colour: "#ABCDEF", scale: 300 });
    expect(normalizeDisplay("junk")).toEqual({});
  });

  it("defaults to the system theme and theme-coloured text", () => {
    expect(defaultAppearance.theme).toBe("system");
    expect(normalizeAppearance({ theme: "light" }).theme).toBe("light");
    expect(normalizeAppearance({ theme: "neon" }).theme).toBe("system");
  });

  it("treats the old white default as automatic text colour", () => {
    expect(normalizeAppearance({ textColour: "#FFFFFF" }).textColourAuto).toBe(
      true,
    );
    const picked = normalizeAppearance({ textColour: "#ff8800" });
    expect(picked.textColourAuto).toBe(false);
    expect(
      (appearanceVars(picked) as Record<string, string>)["--dashboard-text"],
    ).toBe("#ff8800");
    // An explicit choice is kept even when it is white
    expect(
      normalizeAppearance({ textColour: "#ffffff", textColourAuto: false })
        .textColourAuto,
    ).toBe(false);
  });

  it("writes page variables, leaving unset options out", () => {
    const vars = appearanceVars(defaultAppearance) as Record<string, string>;
    // Default text and shadow follow the background
    expect(vars["--dashboard-text"]).toBe("var(--backdrop-text)");
    expect(vars["--dashboard-scale"]).toBe("1");
    expect(vars["--dashboard-shadow"]).toBe("var(--backdrop-shadow-soft)");
    expect(vars).not.toHaveProperty("--dashboard-font");
    expect(vars).not.toHaveProperty("--dashboard-weight");
  });

  it("writes only the widget overrides that are set", () => {
    expect(displayVars({})).toEqual({});
    expect(displayVars({ scale: 150, fontFamily: "serif" })).toEqual({
      "--widget-scale": "1.5",
      "--widget-font": 'Georgia, "Times New Roman", serif',
    });
  });

  it("turns custom font names into a safe font-family", () => {
    expect(fontFamilyCss("")).toBeUndefined();
    expect(fontFamilyCss("Inter")).toBe('"Inter", system-ui, sans-serif');
    expect(fontFamilyCss('Bad"; color: red')).toBe(
      '"Bad color: red", system-ui, sans-serif',
    );
  });
});

describe("settings v2 migration", () => {
  it("keeps an existing appearance (e.g. from a restored backup)", () => {
    const custom = { ...defaultAppearance, textScale: 150 };
    expect(
      normalizeSettings(
        settingsMigrations[2]!({ appearance: custom, widgets: [] }),
      ).appearance,
    ).toEqual(custom);
  });

  it("adds the default appearance to v1 settings", () => {
    const v1 = { widgets: [] };
    const migrated = settingsMigrations[2]!(v1);
    expect(normalizeSettings(migrated)).toEqual({
      appearance: defaultAppearance,
      ui: { locked: false, widgetsHidden: false },
      widgets: [],
    });
  });
});
