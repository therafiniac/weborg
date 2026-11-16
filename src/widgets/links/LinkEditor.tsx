import { ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

import { SelectField, TextField } from "@/ui/fields";

import { ICON_NAMES, iconLabel } from "./icons";
import type { Link } from "./model";
import { linkLabel, normalizeUrl } from "./url";

const iconOptions = [
  { value: "auto", label: "Automatic" },
  { value: "none", label: "No icon" },
  ...ICON_NAMES.map((name) => ({ value: name, label: iconLabel(name) })),
];

interface Props {
  link: Link;
  open: boolean;
  isFirst: boolean;
  isLast: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<Omit<Link, "kind" | "id">>) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  /** Extra controls, e.g. the folder picker. */
  children?: ReactNode;
}

export default function LinkEditor({
  link,
  open,
  isFirst,
  isLast,
  onToggle,
  onChange,
  onMove,
  onRemove,
  children,
}: Props) {
  const label = link.url ? linkLabel(link) : "New link";
  const invalid = link.url !== "" && normalizeUrl(link.url) === null;

  return (
    <li className="item-editor">
      <div className="item-editor__row">
        <span className="item-editor__title">
          {label}
          {invalid && <span className="field__error"> (invalid address)</span>}
        </span>
        <EditorButtons
          label={label}
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
            label="Address"
            type="url"
            value={link.url}
            placeholder="example.com"
            invalid={invalid}
            hint={invalid ? "Enter a web address like example.com" : undefined}
            onChange={(url) => onChange({ url })}
          />
          <TextField
            label="Name (optional)"
            value={link.name}
            onChange={(name) => onChange({ name })}
          />
          <SelectField
            label="Icon"
            value={link.icon}
            options={iconOptions}
            onChange={(icon) => onChange({ icon })}
          />
          {children}
        </div>
      )}
    </li>
  );
}

export function EditorButtons({
  label,
  open,
  isFirst,
  isLast,
  onToggle,
  onMove,
  onRemove,
}: {
  label: string;
  open: boolean;
  isFirst: boolean;
  isLast: boolean;
  onToggle: () => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <>
      <button
        type="button"
        className="icon-button"
        aria-label={`Edit ${label}`}
        aria-expanded={open}
        onClick={onToggle}
      >
        <Pencil size={15} aria-hidden />
      </button>
      <button
        type="button"
        className="icon-button"
        aria-label={`Move ${label} up`}
        disabled={isFirst}
        onClick={() => onMove(-1)}
      >
        <ChevronUp size={16} aria-hidden />
      </button>
      <button
        type="button"
        className="icon-button"
        aria-label={`Move ${label} down`}
        disabled={isLast}
        onClick={() => onMove(1)}
      >
        <ChevronDown size={16} aria-hidden />
      </button>
      <button
        type="button"
        className="icon-button"
        aria-label={`Remove ${label}`}
        onClick={onRemove}
      >
        <Trash2 size={15} aria-hidden />
      </button>
    </>
  );
}
