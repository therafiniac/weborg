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

export interface LinksData {
  items: Item[];
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

export const defaultLinksData = (): LinksData => ({
  items: [
    newLink("https://www.wikipedia.org", "Wikipedia"),
    newLink("https://github.com", "GitHub"),
  ],
  columns: 6,
  openInNewTab: false,
  shortcuts: true,
  favicons: false,
  style: glassPreset,
});
