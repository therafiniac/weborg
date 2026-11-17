import { X } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

import { NamedIcon } from "./icons";
import LinkTile from "./LinkTile";
import type { Folder, Link } from "./model";
import AddLinkTile from "./AddLinkTile";
import QuickAddForm from "./settings/QuickAddForm";
import { useAnchoredPopover } from "./useAnchoredPopover";

interface Props {
  folder: Folder;
  /** The folder tile the popover points at. */
  anchor: HTMLElement | null;
  className: string;
  style: CSSProperties;
  columns: number;
  openInNewTab: boolean;
  favicons: boolean;
  shortcuts: boolean;
  /** Show the "+" tile for adding links to this folder. */
  showAddTile: boolean;
  onAddLink: (link: Link) => void;
  onClose: () => void;
}

/**
 * Popover listing a folder's links, attached to its tile. Rendered into
 * <body> so slot transforms cannot offset it; positioned with fixed coords.
 */
export default function FolderPopup({
  folder,
  anchor,
  className,
  style,
  columns,
  openInNewTab,
  favicons,
  shortcuts,
  showAddTile,
  onAddLink,
  onClose,
}: Props) {
  const [adding, setAdding] = useState(false);
  const titleId = `folder-${folder.id}-title`;

  const {
    popoverRef,
    bodyRef,
    focusRef: closeRef,
  } = useAnchoredPopover<HTMLDivElement, HTMLButtonElement>({
    anchor,
    onClose,
    layoutKey: `${folder.links.length}-${adding}`,
  });

  return createPortal(
    <div
      ref={popoverRef}
      className="folder-popup"
      role="dialog"
      aria-labelledby={titleId}
      style={{ ...style, visibility: "hidden" }}
    >
      <span className="folder-popup__arrow" aria-hidden />
      <div ref={bodyRef} className="folder-popup__body">
        <header className="folder-popup__header">
          <h2 id={titleId}>
            <NamedIcon name={folder.icon} size={18} />
            {folder.name || "Folder"}
          </h2>
          <button
            ref={closeRef}
            type="button"
            className="folder-popup__close"
            aria-label="Close folder"
            onClick={onClose}
          >
            <X size={18} aria-hidden />
          </button>
        </header>

        {folder.links.length === 0 && !showAddTile ? (
          <p className="folder-popup__empty">
            This folder is empty. Add links to it in settings.
          </p>
        ) : (
          <nav
            className={className}
            aria-label={folder.name || "Folder"}
            style={
              {
                "--links-columns": String(
                  Math.max(
                    1,
                    Math.min(
                      columns,
                      folder.links.length + (showAddTile ? 1 : 0),
                    ),
                  ),
                ),
              } as CSSProperties
            }
          >
            {folder.links.map((link, index) => (
              <LinkTile
                key={link.id}
                link={link}
                number={shortcuts && index < 9 ? index + 1 : undefined}
                openInNewTab={openInNewTab}
                favicons={favicons}
              />
            ))}
            {showAddTile && (
              <AddLinkTile
                label={`Add a link to ${folder.name || "this folder"}`}
                expanded={adding}
                onClick={() => setAdding(!adding)}
              />
            )}
          </nav>
        )}
        {adding && (
          <div className="folder-popup__add">
            <QuickAddForm
              title={`Add to ${folder.name || "folder"}`}
              folderId={folder.id}
              autoFocus
              onAdd={(link) => onAddLink(link)}
            />
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
