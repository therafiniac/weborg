import type { Item } from "./model";
import { linksMigrations } from "./model";
import { activeTabOf, buildTabs, LOOSE_TAB_ID, tabIndexForKey } from "./tabs";

const link = (id: string) =>
  ({ kind: "link", id, url: `${id}.test`, name: id, icon: "auto" }) as const;

const items: Item[] = [
  link("a"),
  {
    kind: "folder",
    id: "f",
    name: "Work",
    icon: "briefcase",
    links: [link("b")],
  },
  link("c"),
  { kind: "folder", id: "g", name: "", icon: "folder", links: [] },
];

describe("tabs layout", () => {
  it("puts loose links in a first 'Links' tab, then folders in order", () => {
    const tabs = buildTabs(items);
    expect(tabs.map((tab) => [tab.id, tab.name])).toEqual([
      [LOOSE_TAB_ID, "Links"],
      ["f", "Work"],
      ["g", "Folder"],
    ]);
    expect(tabs[0]!.links.map((l) => l.id)).toEqual(["a", "c"]);
  });

  it("omits the Links tab when every link is in a folder", () => {
    expect(
      buildTabs(items.filter((i) => i.kind === "folder")).map((t) => t.id),
    ).toEqual(["f", "g"]);
  });

  it("restores the saved tab, falling back to the first", () => {
    const tabs = buildTabs(items);
    expect(activeTabOf(tabs, "f")?.id).toBe("f");
    expect(activeTabOf(tabs, "deleted")?.id).toBe(LOOSE_TAB_ID);
    expect(activeTabOf([], null)).toBeUndefined();
  });

  it("moves between tabs with arrow keys, Home and End, wrapping around", () => {
    expect(tabIndexForKey("ArrowRight", 2, 3)).toBe(0);
    expect(tabIndexForKey("ArrowLeft", 0, 3)).toBe(2);
    expect(tabIndexForKey("Home", 2, 3)).toBe(0);
    expect(tabIndexForKey("End", 0, 3)).toBe(2);
    expect(tabIndexForKey("Enter", 0, 3)).toBeNull();
  });

  it("never overwrites existing values when migrating", () => {
    expect(
      linksMigrations[2]!({
        layout: "tabs",
        activeTab: "w",
        tabSwitch: "hover",
      }),
    ).toEqual({ layout: "tabs", activeTab: "w", tabSwitch: "hover" });
  });

  it("migrates v1 data to the grid layout", () => {
    expect(linksMigrations[2]!({ items: [], columns: 4 })).toEqual({
      items: [],
      columns: 4,
      layout: "grid",
      tabSwitch: "click",
      activeTab: null,
    });
  });
});
