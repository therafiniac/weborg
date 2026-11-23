import { fakeBrowser } from "wxt/testing/fake-browser";
import { storage } from "wxt/utils/storage";

import {
  backgroundItem,
  defaultBackground,
} from "@/core/background/background";
import { widgetDataKey } from "@/core/widgets/data";

import {
  BackupError,
  createBackup,
  parseBackup,
  resetAll,
  restoreBackup,
} from "./backup";
import { defaultSettings, settingsItem } from "./settings";

describe("backup", () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it("round-trips settings, background and widget data", async () => {
    await backgroundItem.setValue({ ...defaultBackground, kind: "colour" });
    await storage.setItem(widgetDataKey("default-greeting"), { name: "Hi" });

    const json = JSON.stringify(await createBackup());
    await resetAll();
    expect(await storage.getItem(widgetDataKey("default-greeting"))).toBeNull();

    await restoreBackup(parseBackup(json));
    expect((await backgroundItem.getValue()).kind).toBe("colour");
    expect(await storage.getItem(widgetDataKey("default-greeting"))).toEqual({
      name: "Hi",
    });
    expect(await settingsItem.getValue()).toEqual(defaultSettings);
  });

  it("does not claim to include the background image", async () => {
    await backgroundItem.setValue({
      ...defaultBackground,
      kind: "image",
      image: {
        fit: "cover",
        updatedAt: 123,
        perTheme: false,
        lightUpdatedAt: null,
      },
    });
    expect((await createBackup()).background.image.updatedAt).toBeNull();
  });

  it("drops widget data for widgets that are not in the settings", () => {
    const backup = parseBackup(
      JSON.stringify({
        format: "weborg",
        formatVersion: 1,
        settings: defaultSettings,
        widgets: { "default-greeting": { name: "ok" }, orphan: { text: "x" } },
      }),
    );
    expect(Object.keys(backup.widgets)).toEqual(["default-greeting"]);
  });

  it.each([
    ["not json", /not valid JSON/],
    [JSON.stringify({ hello: 1 }), /not a Weborg backup/],
    [JSON.stringify({ format: "weborg" }), /missing its version/],
    [JSON.stringify({ format: "weborg", formatVersion: 99 }), /newer version/],
  ])("rejects invalid file %#", (text, message) => {
    expect(() => parseBackup(text)).toThrow(BackupError);
    expect(() => parseBackup(text)).toThrow(message);
  });
});

describe("backup restore with versioned widget data", () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it("keeps restored values even though migrations run again", async () => {
    const { linksWidget } = await import("@/widgets/links");
    const { widgetDataItem } = await import("@/core/widgets/data");
    const { defaultAppearance } = await import("@/core/appearance/appearance");

    const backup = parseBackup(
      JSON.stringify({
        format: "weborg",
        formatVersion: 1,
        settings: {
          appearance: { ...defaultAppearance, textScale: 150 },
          widgets: [
            {
              id: "l1",
              type: "links",
              position: "middle-centre",
              order: 0,
              display: {},
            },
          ],
        },
        widgets: { l1: { items: [], layout: "tabs", activeTab: "x" } },
      }),
    );
    await restoreBackup(backup);

    // Defining the item runs WXT migrations on unversioned data
    const item = widgetDataItem(
      "l1",
      linksWidget as unknown as Parameters<typeof widgetDataItem>[1],
    );
    await item.migrate();
    expect(await item.getValue()).toMatchObject({
      layout: "tabs",
      activeTab: "x",
    });
    expect((await settingsItem.getValue()).appearance.textScale).toBe(150);
  });
});
