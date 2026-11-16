import { FolderPlus } from "lucide-react";
import { useRef, useState } from "react";

import type { MenuItem } from "@/ui/Menu";

import {
  addItem,
  moveItem,
  moveLinkTo,
  removeItem,
  updateItem,
} from "../items";
import { newFolder, type Folder, type Item, type Link } from "../model";
import { linkLabel } from "../url";
import { FolderRow, LinkRow } from "./LinkList";
import QuickAddForm from "./QuickAddForm";

interface Props {
  items: Item[];
  onChange: (items: Item[]) => void;
}

export default function LinksTab({ items, onChange }: Props) {
  // Only one link or folder is edited at a time
  const [editingId, setEditingId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const [quickFolder, setQuickFolder] = useState<string | null>(null);
  const [undo, setUndo] = useState<{ label: string; items: Item[] } | null>(
    null,
  );
  const urlRef = useRef<HTMLInputElement>(null);

  const folders = items.filter((i): i is Folder => i.kind === "folder");
  const folderOptions = [
    { value: "", label: "No folder" },
    ...folders.map((f) => ({ value: f.id, label: f.name || "Folder" })),
  ];

  const change = (next: Item[]) => {
    setUndo(null);
    onChange(next);
  };

  const remove = (item: Item) => {
    if (
      item.kind === "folder" &&
      item.links.length > 0 &&
      !confirm(
        `Delete the folder "${item.name}" and its ${item.links.length} links?`,
      )
    )
      return;
    onChange(removeItem(items, item.id));
    setUndo({
      label: item.kind === "folder" ? item.name || "Folder" : linkLabel(item),
      items,
    });
    if (editingId === item.id) setEditingId(null);
  };

  const orderMenu = (item: Item, index: number, count: number): MenuItem[] => [
    {
      label: "Move up",
      disabled: index === 0,
      onSelect: () => change(moveItem(items, item.id, -1)),
    },
    {
      label: "Move down",
      disabled: index === count - 1,
      onSelect: () => change(moveItem(items, item.id, 1)),
    },
    { label: "Delete", danger: true, onSelect: () => remove(item) },
  ];

  const linkRow = (
    link: Link,
    index: number,
    count: number,
    folderId: string | null,
  ) => (
    <LinkRow
      key={link.id}
      link={link}
      editing={editingId === link.id}
      menu={orderMenu(link, index, count)}
      folderOptions={folderOptions}
      folderId={folderId}
      onEdit={() => setEditingId(link.id)}
      onDone={() => setEditingId(null)}
      onChange={(patch) => change(updateItem<Link>(items, link.id, patch))}
      onMoveToFolder={(target) => change(moveLinkTo(items, link.id, target))}
    />
  );

  return (
    <>
      <QuickAddForm
        folders={folders.map((f) => ({ id: f.id, name: f.name }))}
        folderId={quickFolder}
        onFolderChange={setQuickFolder}
        urlRef={urlRef}
        onAdd={(link, folderId) => {
          change(addItem(items, link, folderId));
          // Make sure the new link is visible in its folder
          if (folderId)
            setCollapsed((set) => {
              const next = new Set(set);
              next.delete(folderId);
              return next;
            });
        }}
      />

      {undo && (
        <p className="undo-bar" role="status">
          Removed {undo.label}.{" "}
          <button
            type="button"
            className="link-button"
            onClick={() => {
              onChange(undo.items);
              setUndo(null);
            }}
          >
            Undo
          </button>
        </p>
      )}

      {items.length === 0 ? (
        <p className="hint">No links yet. Paste one above to get started.</p>
      ) : (
        <ul className="link-list">
          {items.map((item, index) =>
            item.kind === "link" ? (
              linkRow(item, index, items.length, null)
            ) : (
              <FolderRow
                key={item.id}
                folder={item}
                editing={editingId === item.id}
                collapsed={collapsed.has(item.id)}
                menu={orderMenu(item, index, items.length)}
                onToggleCollapsed={() =>
                  setCollapsed((set) => {
                    const next = new Set(set);
                    if (next.has(item.id)) next.delete(item.id);
                    else next.add(item.id);
                    return next;
                  })
                }
                onEdit={() => setEditingId(item.id)}
                onDone={() => setEditingId(null)}
                onChange={(patch) =>
                  change(updateItem<Folder>(items, item.id, patch))
                }
                onAddHere={() => {
                  setQuickFolder(item.id);
                  urlRef.current?.focus();
                }}
              >
                {item.links.map((link, linkIndex) =>
                  linkRow(link, linkIndex, item.links.length, item.id),
                )}
              </FolderRow>
            ),
          )}
        </ul>
      )}

      <button
        type="button"
        className="button"
        onClick={() => {
          const folder = newFolder();
          change(addItem(items, folder));
          setEditingId(folder.id);
        }}
      >
        <FolderPlus size={16} aria-hidden /> New folder
      </button>
    </>
  );
}
