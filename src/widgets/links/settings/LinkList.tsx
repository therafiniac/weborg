import { ChevronDown, ChevronRight, Pencil } from "lucide-react";
import type { ReactNode } from "react";

import Menu, { type MenuItem } from "@/ui/Menu";
import { SelectField, TextField } from "@/ui/fields";

import { ICON_NAMES, iconLabel, isIconName, NamedIcon } from "../icons";
import type { Folder, Link } from "../model";
import { hostname, linkLabel, normalizeUrl } from "../url";

const linkIconOptions = [
  { value: "auto", label: "Automatic (letter or website icon)" },
  { value: "none", label: "No icon" },
  ...ICON_NAMES.map((name) => ({ value: name, label: iconLabel(name) })),
];

const folderIconOptions = ICON_NAMES.map((name) => ({
  value: name,
  label: iconLabel(name),
}));

function RowIcon({ link }: { link: Link }) {
  if (isIconName(link.icon))
    return (
      <span className="link-row__icon">
        <NamedIcon name={link.icon} size={14} />
      </span>
    );
  return (
    <span className="link-row__icon link-row__icon--letter" aria-hidden>
      {linkLabel(link).charAt(0).toUpperCase()}
    </span>
  );
}

interface LinkRowProps {
  link: Link;
  editing: boolean;
  menu: MenuItem[];
  folderOptions: { value: string; label: string }[];
  folderId: string | null;
  onEdit: () => void;
  onDone: () => void;
  onChange: (patch: Partial<Omit<Link, "kind" | "id">>) => void;
  onMoveToFolder: (folderId: string | null) => void;
}

export function LinkRow({
  link,
  editing,
  menu,
  folderOptions,
  folderId,
  onEdit,
  onDone,
  onChange,
  onMoveToFolder,
}: LinkRowProps) {
  const label = linkLabel(link);
  const invalid = normalizeUrl(link.url) === null;

  return (
    <li className={`link-row${editing ? " link-row--editing" : ""}`}>
      <div className="link-row__main">
        <RowIcon link={link} />
        <span className="link-row__text">
          <span className="link-row__name">{label}</span>
          <span className={invalid ? "field__error" : "link-row__domain"}>
            {invalid ? "Invalid address" : hostname(link.url)}
          </span>
        </span>
        <button
          type="button"
          className="icon-button"
          aria-label={`Edit ${label}`}
          aria-expanded={editing}
          onClick={editing ? onDone : onEdit}
        >
          <Pencil size={15} aria-hidden />
        </button>
        <Menu label={`More actions for ${label}`} items={menu} />
      </div>
      {editing && (
        <div className="link-row__editor">
          <TextField
            label="Address"
            type="url"
            value={link.url}
            invalid={invalid}
            hint={invalid ? "Enter a web address like example.com" : undefined}
            onChange={(url) => onChange({ url })}
          />
          <TextField
            label="Name (optional)"
            value={link.name}
            placeholder={hostname(link.url)}
            onChange={(name) => onChange({ name })}
          />
          <SelectField
            label="Icon"
            value={link.icon}
            options={linkIconOptions}
            onChange={(icon) => onChange({ icon })}
          />
          {folderOptions.length > 1 && (
            <SelectField
              label="Folder"
              value={folderId ?? ""}
              options={folderOptions}
              onChange={(target) => onMoveToFolder(target || null)}
            />
          )}
          <button
            type="button"
            className="button button--primary"
            onClick={onDone}
          >
            Done
          </button>
        </div>
      )}
    </li>
  );
}

interface FolderRowProps {
  folder: Folder;
  editing: boolean;
  collapsed: boolean;
  menu: MenuItem[];
  onToggleCollapsed: () => void;
  onEdit: () => void;
  onDone: () => void;
  onChange: (patch: Partial<Pick<Folder, "name" | "icon">>) => void;
  children: ReactNode;
}

export function FolderRow({
  folder,
  editing,
  collapsed,
  menu,
  onToggleCollapsed,
  onEdit,
  onDone,
  onChange,
  children,
}: FolderRowProps) {
  const label = folder.name || "Folder";
  const count = folder.links.length;
  return (
    <li
      className={`link-row link-row--folder${editing ? " link-row--editing" : ""}`}
    >
      <div className="link-row__main">
        <button
          type="button"
          className="link-row__toggle"
          aria-expanded={!collapsed}
          aria-label={`${label} folder, ${count} ${count === 1 ? "link" : "links"}`}
          onClick={onToggleCollapsed}
        >
          {collapsed ? (
            <ChevronRight size={16} aria-hidden />
          ) : (
            <ChevronDown size={16} aria-hidden />
          )}
          <span className="link-row__icon">
            <NamedIcon name={folder.icon} size={14} />
          </span>
          <span className="link-row__name">{label}</span>
          <span className="link-row__count" aria-hidden>
            {count}
          </span>
        </button>
        <button
          type="button"
          className="icon-button"
          aria-label={`Edit folder ${label}`}
          aria-expanded={editing}
          onClick={editing ? onDone : onEdit}
        >
          <Pencil size={15} aria-hidden />
        </button>
        <Menu label={`More actions for folder ${label}`} items={menu} />
      </div>
      {editing && (
        <div className="link-row__editor">
          <TextField
            label="Folder name"
            value={folder.name}
            onChange={(name) => onChange({ name })}
          />
          <SelectField
            label="Icon"
            value={folder.icon}
            options={folderIconOptions}
            onChange={(icon) => onChange({ icon })}
          />
          <button
            type="button"
            className="button button--primary"
            onClick={onDone}
          >
            Done
          </button>
        </div>
      )}
      {!collapsed &&
        (count > 0 ? (
          <ul className="link-list link-list--nested">{children}</ul>
        ) : (
          <p className="hint link-row__empty">Empty</p>
        ))}
    </li>
  );
}
