import { X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, type CSSProperties } from "react";
import { createPortal } from "react-dom";

import { NamedIcon } from "./icons";
import LinkTile from "./LinkTile";
import type { Folder } from "./model";
import { placePopover } from "./popover";

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
  onClose,
}: Props) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const titleId = `folder-${folder.id}-title`;

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Position next to the tile; follow resizes and scrolling
  useLayoutEffect(() => {
    const popover = popoverRef.current;
    const body = bodyRef.current;
    if (!popover || !body || !anchor) return;

    const place = () => {
      body.style.maxHeight = "";
      const pos = placePopover(
        anchor.getBoundingClientRect(),
        { width: popover.offsetWidth, height: body.scrollHeight },
        { width: window.innerWidth, height: window.innerHeight },
      );
      popover.style.top = `${pos.top}px`;
      popover.style.left = `${pos.left}px`;
      body.style.maxHeight = `${pos.maxHeight}px`;
      popover.style.setProperty("--arrow-left", `${pos.arrowLeft}px`);
      popover.dataset.placement = pos.placement;
      popover.style.visibility = "visible";
    };

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [anchor, folder.links.length]);

  // Focus the close button, close on Esc or a click outside
  useEffect(() => {
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      // The tile toggles the popover itself
      if (popoverRef.current?.contains(target) || anchor?.contains(target))
        return;
      onCloseRef.current();
    };

    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [anchor]);

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
