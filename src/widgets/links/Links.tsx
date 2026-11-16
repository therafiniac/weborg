import { useRef, useState } from "react";

import type { WidgetProps } from "@/core/widgets/types";

import FolderPopup from "./FolderPopup";
import FolderTile from "./FolderTile";
import LinkTile from "./LinkTile";
import type { Folder, Link, LinksData } from "./model";
import { resolveStyle, styleClasses, styleVars } from "./style";
import { normalizeUrl } from "./url";
import { useNumberShortcuts } from "./useNumberShortcuts";
import "./Links.css";

export function openLink(link: Link, newTab: boolean) {
  const url = normalizeUrl(link.url);
  if (!url) return;
  if (newTab) window.open(url, "_blank", "noopener");
  else window.location.assign(url);
}

export default function Links({ data }: WidgetProps<LinksData>) {
  const style = resolveStyle(data.style);
  const [openFolderId, setOpenFolderId] = useState<string | null>(null);
  const folderRefs = useRef(new Map<string, HTMLButtonElement>());

  const openFolder = data.items.find(
    (item): item is Folder =>
      item.kind === "folder" && item.id === openFolderId,
  );

  const closeFolder = () => {
    setOpenFolderId(null);
    // Return focus to the tile that opened the popup
    if (openFolderId) folderRefs.current.get(openFolderId)?.focus();
  };

  useNumberShortcuts(data.shortcuts, (index) => {
    if (openFolder) {
      const link = openFolder.links[index];
      if (link) openLink(link, data.openInNewTab);
      return;
    }
    const item = data.items[index];
    if (item?.kind === "link") openLink(item, data.openInNewTab);
    else if (item?.kind === "folder") setOpenFolderId(item.id);
  });

  if (data.items.length === 0)
    return <p className="links__empty">Add links in settings.</p>;

  const classes = styleClasses(style);
  const vars = styleVars(style, data.columns);

  return (
    <>
      <nav className={classes} style={vars} aria-label="Quick links">
        {data.items.map((item, index) => {
          const number = data.shortcuts && index < 9 ? index + 1 : undefined;
          return item.kind === "link" ? (
            <LinkTile
              key={item.id}
              link={item}
              number={number}
              openInNewTab={data.openInNewTab}
              favicons={data.favicons}
            />
          ) : (
            <FolderTile
              key={item.id}
              ref={(element) => {
                if (element) folderRefs.current.set(item.id, element);
                else folderRefs.current.delete(item.id);
              }}
              folder={item}
              number={number}
              open={openFolderId === item.id}
              onOpen={() => setOpenFolderId(item.id)}
            />
          );
        })}
      </nav>

      {openFolder && (
        <FolderPopup
          folder={openFolder}
          className={classes}
          style={vars}
          columns={data.columns}
          openInNewTab={data.openInNewTab}
          favicons={data.favicons}
          shortcuts={data.shortcuts}
          onClose={closeFolder}
        />
      )}
    </>
  );
}
