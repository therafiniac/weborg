import type { Item, Link } from "./model";

export const LOOSE_TAB_ID = "loose-links";

export interface Tab {
  id: string;
  name: string;
  icon: string;
  links: Link[];
}

/**
 * Tabs for the tabs layout: a "Links" tab for links outside folders (only
 * when there are any), then one tab per folder, in list order.
 */
export function buildTabs(items: readonly Item[]): Tab[] {
  const loose = items.filter((item): item is Link => item.kind === "link");
  const tabs: Tab[] = items.flatMap((item) =>
    item.kind === "folder"
      ? [
          {
            id: item.id,
            name: item.name || "Folder",
            icon: item.icon,
            links: item.links,
          },
        ]
      : [],
  );
  return loose.length > 0
    ? [
        { id: LOOSE_TAB_ID, name: "Links", icon: "bookmark", links: loose },
        ...tabs,
      ]
    : tabs;
}

/** The saved tab if it still exists, otherwise the first one. */
export function activeTabOf(
  tabs: readonly Tab[],
  activeId: string | null,
): Tab | undefined {
  return tabs.find((tab) => tab.id === activeId) ?? tabs[0];
}

/** Index to move to for a tablist key press, or null for other keys. */
export function tabIndexForKey(
  key: string,
  current: number,
  count: number,
): number | null {
  if (count === 0) return null;
  switch (key) {
    case "ArrowRight":
      return (current + 1) % count;
    case "ArrowLeft":
      return (current - 1 + count) % count;
    case "Home":
      return 0;
    case "End":
      return count - 1;
    default:
      return null;
  }
}
