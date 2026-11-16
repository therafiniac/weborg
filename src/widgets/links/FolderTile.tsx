import { forwardRef } from "react";

import { NamedIcon } from "./icons";
import type { Folder } from "./model";

interface Props {
  folder: Folder;
  number?: number;
  open: boolean;
  onOpen: () => void;
}

const FolderTile = forwardRef<HTMLButtonElement, Props>(function FolderTile(
  { folder, number, open, onOpen },
  ref,
) {
  const label = folder.name || "Folder";
  const count = `${folder.links.length} ${folder.links.length === 1 ? "link" : "links"}`;
  return (
    <button
      ref={ref}
      type="button"
      className="links__item links__folder"
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-label={`${label} folder, ${count}`}
      title={
        number ? `${label}, ${count} (press ${number})` : `${label}, ${count}`
      }
      onClick={onOpen}
    >
      <span className="links__icon">
        <NamedIcon name={folder.icon} />
      </span>
      <span className="links__label">{label}</span>
    </button>
  );
});

export default FolderTile;
