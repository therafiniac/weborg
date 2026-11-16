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

  it("writes page variables, leaving unset options out", () => {
    const vars = appearanceVars(defaultAppearance) as Record<string, string>;
    expect(vars["--dashboard-text"]).toBe("#ffffff");
    expect(vars["--dashboard-scale"]).toBe("1");
    expect(vars["--dashboard-shadow"]).toContain("rgb");
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
  it("adds the default appearance to v1 settings", () => {
    const v1 = { widgets: [] };
    const migrated = settingsMigrations[2]!(v1);
    expect(normalizeSettings(migrated)).toEqual({
      appearance: defaultAppearance,
      widgets: [],
    });
  });
});
