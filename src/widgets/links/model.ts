import { createId } from "@/core/storage/ids";

import { glassPreset, type LinkStyle } from "./style";

/**
 * "auto": website icon when favicons are enabled, otherwise a letter badge.
 * "none": no icon. Any other value is a curated icon name (see icons.tsx).
 */
export type IconChoice = string;

export interface Link {
  kind: "link";
  id: string;
  url: string;
  name: string;
  icon: IconChoice;
}

export interface Folder {
  kind: "folder";
  id: string;
  name: string;
  /** Curated icon name; "folder" by default. */
  icon: string;
  /** One level only: folders never contain folders. */
  links: Link[];
}

export type Item = Link | Folder;

export type LinksLayout = "grid" | "tabs";
export type TabSwitch = "click" | "hover";

export interface LinksData {
  items: Item[];
  /** "grid": tiles, folders open as popovers. "tabs": folders are tabs. */
  layout: LinksLayout;
  /** How tabs switch in the tabs layout. */
  tabSwitch: TabSwitch;
  /** Last selected tab id, restored on the next new tab. */
  activeTab: string | null;
  columns: number;
  openInNewTab: boolean;
  /** Number keys 1-9 open links and folders. */
  shortcuts: boolean;
  /** Load website icons from DuckDuckGo (sends each link's domain). */
  favicons: boolean;
  style: LinkStyle;
}

export const newLink = (url = "", name = ""): Link => ({
  kind: "link",
  id: createId(),
  url,
  name,
  icon: "auto",
});

export const newFolder = (name = "New folder"): Folder => ({
  kind: "folder",
  id: createId(),
  name,
  icon: "folder",
  links: [],
});

export const LINKS_DATA_VERSION = 2;

/**
 * Widget data migrations, keyed by the version they upgrade to. They only
 * fill missing fields: data written without a version marker (e.g. by a
 * backup restore) is treated as old and migrated again, so a migration must
 * never overwrite values that are already there.
 */
export const linksMigrations: Record<number, (old: unknown) => unknown> = {
  // v2: tabs layout
  2: (old) => ({
    layout: "grid",
    tabSwitch: "click",
    activeTab: null,
    ...(typeof old === "object" && old !== null ? old : {}),
  }),
};

export const defaultLinksData = (): LinksData => ({
  items: [
    newLink("https://www.wikipedia.org", "Wikipedia"),
    newLink("https://github.com", "GitHub"),
  ],
  layout: "grid",
  tabSwitch: "click",
  activeTab: null,
  columns: 6,
  openInNewTab: false,
  shortcuts: true,
  favicons: false,
  style: glassPreset,
});
