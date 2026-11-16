import { X } from "lucide-react";
import { useEffect, useRef, type CSSProperties } from "react";
import { createPortal } from "react-dom";

import { NamedIcon } from "./icons";
import LinkTile from "./LinkTile";
import type { Folder } from "./model";

interface Props {
  folder: Folder;
  className: string;
  style: CSSProperties;
  columns: number;
  openInNewTab: boolean;
  favicons: boolean;
  shortcuts: boolean;
  onClose: () => void;
}

/**
 * Dialog listing a folder's links. Rendered into <body> so it is not
 * clipped or offset by the widget's slot.
 */
export default function FolderPopup({
  folder,
  className,
  style,
  columns,
  openInNewTab,
  favicons,
  shortcuts,
  onClose,
}: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const titleId = `folder-${folder.id}-title`;

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Runs once per open: focus the close button and listen for Esc
  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return createPortal(
    <div className="folder-popup__backdrop" onClick={onClose}>
      <div
        className="folder-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={style}
        onClick={(event) => event.stopPropagation()}
      >
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

        {folder.links.length === 0 ? (
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
                  Math.max(1, Math.min(columns, folder.links.length)),
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
          </nav>
        )}
      </div>
    </div>,
    document.body,
  );
}
