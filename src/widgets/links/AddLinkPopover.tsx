import type { CSSProperties } from "react";
import { createPortal } from "react-dom";

import type { Link } from "./model";
import QuickAddForm from "./settings/QuickAddForm";
import { useAnchoredPopover } from "./useAnchoredPopover";

interface Props {
  anchor: HTMLElement | null;
  /** Where new links go; null = top level. */
  folderId: string | null;
  title: string;
  style: CSSProperties;
  onAdd: (link: Link, folderId: string | null) => void;
  onClose: () => void;
}

/** Small add-link form attached to the "+" tile. Stays open for more. */
export default function AddLinkPopover({
  anchor,
  folderId,
  title,
  style,
  onAdd,
  onClose,
}: Props) {
  const { popoverRef, focusRef: urlRef } = useAnchoredPopover<
    HTMLDivElement,
    HTMLInputElement
  >({ anchor, onClose });

  return createPortal(
    <div
      ref={popoverRef}
      className="folder-popup add-popover"
      role="dialog"
      aria-label={title}
      style={{ ...style, visibility: "hidden" }}
    >
      <span className="folder-popup__arrow" aria-hidden />
      <div className="add-popover__body">
        <QuickAddForm
          title={title}
          folderId={folderId}
          urlRef={urlRef}
          onAdd={onAdd}
        />
      </div>
    </div>,
    document.body,
  );
}
