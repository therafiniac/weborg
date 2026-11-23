import { useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

import SegmentedControl from "@/ui/SegmentedControl";

import type { Folder, Link } from "./model";
import NewFolderForm from "./settings/NewFolderForm";
import QuickAddForm from "./settings/QuickAddForm";
import { useAnchoredPopover } from "./useAnchoredPopover";

interface Props {
  anchor: HTMLElement | null;
  /** Where new links go; null = top level. */
  folderId: string | null;
  title: string;
  style: CSSProperties;
  onAdd: (link: Link, folderId: string | null) => void;
  /** Offer "Folder" as well as "Link" (not inside folders: no nesting). */
  onAddFolder?: (folder: Folder) => void;
  onClose: () => void;
}

/**
 * Small form attached to the "+" tile: add links (stays open for more) or,
 * at the top level, create a folder.
 */
export default function AddLinkPopover({
  anchor,
  folderId,
  title,
  style,
  onAdd,
  onAddFolder,
  onClose,
}: Props) {
  const [mode, setMode] = useState<"link" | "folder">("link");
  const { popoverRef, focusRef } = useAnchoredPopover<
    HTMLDivElement,
    HTMLInputElement
  >({ anchor, onClose, layoutKey: mode });

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
        {onAddFolder && (
          <SegmentedControl<"link" | "folder">
            label="What to add"
            value={mode}
            options={[
              { value: "link", label: "Link" },
              { value: "folder", label: "Folder" },
            ]}
            onChange={setMode}
          />
        )}
        {onAddFolder && (
          <p className="add-popover__hint">
            {mode === "link"
              ? "Tip: choose Folder to group several links under one tile."
              : "A folder groups links under one tile. Add links to it after."}
          </p>
        )}
        {mode === "link" || !onAddFolder ? (
          <QuickAddForm
            title={title}
            folderId={folderId}
            urlRef={focusRef}
            autoFocus={mode === "link" && Boolean(onAddFolder)}
            onAdd={onAdd}
          />
        ) : (
          <NewFolderForm
            nameRef={focusRef}
            autoFocus
            onCreate={(folder) => {
              onAddFolder(folder);
              onClose();
            }}
          />
        )}
      </div>
    </div>,
    document.body,
  );
}
