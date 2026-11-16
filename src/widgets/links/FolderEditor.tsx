import { Plus } from "lucide-react";

import { SelectField, TextField } from "@/ui/fields";

import { ICON_NAMES, iconLabel } from "./icons";
import { EditorButtons } from "./LinkEditor";
import type { Folder } from "./model";

const iconOptions = ICON_NAMES.map((name) => ({
  value: name,
  label: iconLabel(name),
}));

interface Props {
  folder: Folder;
  open: boolean;
  isFirst: boolean;
  isLast: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<Pick<Folder, "name" | "icon">>) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  onAddLink: () => void;
  /** The folder's link editors. */
  children: React.ReactNode;
}

export default function FolderEditor({
  folder,
  open,
  isFirst,
  isLast,
  onToggle,
  onChange,
  onMove,
  onRemove,
  onAddLink,
  children,
}: Props) {
  const label = folder.name || "Folder";
  return (
    <li className="item-editor item-editor--folder">
      <div className="item-editor__row">
        <span className="item-editor__title">
          {label}{" "}
          <span className="hint">
            ({folder.links.length}{" "}
            {folder.links.length === 1 ? "link" : "links"})
          </span>
        </span>
        <EditorButtons
          label={`folder ${label}`}
          open={open}
          isFirst={isFirst}
          isLast={isLast}
          onToggle={onToggle}
          onMove={onMove}
          onRemove={onRemove}
        />
      </div>
      {open && (
        <div className="item-editor__body">
          <TextField
            label="Folder name"
            value={folder.name}
            onChange={(name) => onChange({ name })}
          />
          <SelectField
            label="Icon"
            value={folder.icon}
            options={iconOptions}
            onChange={(icon) => onChange({ icon })}
          />
        </div>
      )}
      <div className="item-editor__children">
        <ul className="item-list">{children}</ul>
        <button type="button" className="button" onClick={onAddLink}>
          <Plus size={16} aria-hidden /> Add link to {label}
        </button>
      </div>
    </li>
  );
}
