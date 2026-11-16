import { useRef, useState } from "react";

import type { WidgetProps } from "@/core/widgets/types";

import AddLinkPopover from "./AddLinkPopover";
import AddLinkTile from "./AddLinkTile";
import FolderPopup from "./FolderPopup";
import { addItem } from "./items";
import { DraggableTile, TileDnd } from "./TileDnd";
import FolderTile from "./FolderTile";
import LinksTabs from "./LinksTabs";
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

export default function Links({ data, setData }: WidgetProps<LinksData>) {
  const style = resolveStyle(data.style);
  // The open folder and the tile it is attached to
  const [open, setOpen] = useState<{
    id: string;
    anchor: HTMLElement | null;
  } | null>(null);
  const openFolderId = open?.id ?? null;
  const folderRefs = useRef(new Map<string, HTMLButtonElement>());

  const [addAnchor, setAddAnchor] = useState<HTMLElement | null>(null);
  const addTileRef = useRef<HTMLButtonElement>(null);
  const addLink = (link: Link, folderId: string | null) =>
    setData({ ...data, items: addItem(data.items, link, folderId) });

  const showFolder = (id: string) =>
    setOpen({ id, anchor: folderRefs.current.get(id) ?? null });

  const openFolder = data.items.find(
    (item): item is Folder =>
      item.kind === "folder" && item.id === openFolderId,
  );

  const closeFolder = () => {
    setOpen(null);
    // Return focus to the tile that opened the popover
    open?.anchor?.focus();
  };

  // Grid layout shortcuts; the tabs layout handles its own
  useNumberShortcuts(data.shortcuts && data.layout !== "tabs", (index) => {
    if (openFolder) {
      const link = openFolder.links[index];
      if (link) openLink(link, data.openInNewTab);
      return;
    }
    const item = data.items[index];
    if (item?.kind === "link") openLink(item, data.openInNewTab);
    else if (item?.kind === "folder") showFolder(item.id);
  });

  if (data.items.length === 0 && !data.showAddTile)
    return <p className="links__empty">Add links in settings.</p>;

  const classes = styleClasses(style);

  if (data.layout === "tabs")
    return (
      <TileDnd
        items={data.items}
        enabled={!data.lockLinks}
        onChange={(items) => setData({ ...data, items })}
        overlayClassName={classes}
        overlayStyle={styleVars(style, data.columns)}
      >
        <LinksTabs
          data={data}
          setData={setData}
          className={classes}
          style={styleVars(style, data.columns)}
          onAddLink={addLink}
          onAddFolder={(folder) =>
            // A new folder becomes a new tab; switch to it
            setData({
              ...data,
              items: addItem(data.items, folder),
              activeTab: folder.id,
            })
          }
          onOpenLink={(index, links) => {
            const link = links[index];
            if (link?.kind === "link") openLink(link, data.openInNewTab);
          }}
        />
      </TileDnd>
    );

  // Never reserve more columns than there are tiles, so they stay centred
  const tileCount = data.items.length + (data.showAddTile ? 1 : 0);
  const vars = styleVars(style, Math.min(data.columns, tileCount));

  return (
    <>
      <TileDnd
        items={data.items}
        enabled={!data.lockLinks}
        onChange={(items) => setData({ ...data, items })}
        overlayClassName={classes}
        overlayStyle={vars}
      >
        <nav className={classes} style={vars} aria-label="Quick links">
          {data.items.map((item, index) => {
            const number = data.shortcuts && index < 9 ? index + 1 : undefined;
            return (
              <DraggableTile
                key={item.id}
                id={item.id}
                isFolder={item.kind === "folder"}
              >
                {item.kind === "link" ? (
                  <LinkTile
                    link={item}
                    number={number}
                    openInNewTab={data.openInNewTab}
                    favicons={data.favicons}
                  />
                ) : (
                  <FolderTile
                    ref={(element) => {
                      if (element) folderRefs.current.set(item.id, element);
                      else folderRefs.current.delete(item.id);
                    }}
                    folder={item}
                    number={number}
                    open={openFolderId === item.id}
                    onOpen={() =>
                      // Clicking the open folder's tile again closes it
                      openFolderId === item.id
                        ? setOpen(null)
                        : showFolder(item.id)
                    }
                  />
                )}
              </DraggableTile>
            );
          })}
          {data.showAddTile && (
            <AddLinkTile
              label="Add a link"
              expanded={addAnchor !== null}
              onClick={() =>
                setAddAnchor(addAnchor ? null : addTileRef.current)
              }
              ref={addTileRef}
            />
          )}
        </nav>
      </TileDnd>

      {addAnchor && (
        <AddLinkPopover
          anchor={addAnchor}
          folderId={null}
          title="Add a link"
          style={vars}
          onAdd={addLink}
          onAddFolder={(folder) =>
            setData({ ...data, items: addItem(data.items, folder) })
          }
          onClose={() => setAddAnchor(null)}
        />
      )}

      {openFolder && (
        <FolderPopup
          folder={openFolder}
          anchor={open?.anchor ?? null}
          className={classes}
          style={vars}
          columns={data.columns}
          openInNewTab={data.openInNewTab}
          favicons={data.favicons}
          shortcuts={data.shortcuts}
          showAddTile={data.showAddTile}
          onAddLink={(link) => addLink(link, openFolder.id)}
          onClose={closeFolder}
        />
      )}
    </>
  );
}
