import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  pointerWithin,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { FolderPlus, GripVertical } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";

import type { MenuItem } from "@/ui/Menu";

import {
  addItem,
  dropOnItem,
  findLink,
  moveItem,
  moveLinkTo,
  removeItem,
  updateItem,
} from "../items";
import { newFolder, type Folder, type Item, type Link } from "../model";
import { linkLabel } from "../url";
import { FolderRow, LinkRow, type DragProps } from "./LinkList";
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
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const sensors = useSensors(
    // A small threshold so clicks on the handle don't start a drag
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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

  // Flat rows (folder children indented)
  const rows = flattenRows(items, collapsed, activeId);
  const activeIsLink =
    activeId !== null && findLink(items, activeId) !== undefined;
  const draggingNestedLink =
    activeIsLink && !items.some((item) => item.id === activeId);
  const activeRow = rows.find(
    (row): row is ItemRow => row.kind === "item" && row.id === activeId,
  );

  /** Where an insertion line shows while dragging over a row. */
  const indicatorFor = (row: ItemRow): "before" | "after" | undefined => {
    if (!activeRow || overId !== row.id || row.id === activeId) return;
    // A link over a folder drops inside it (highlighted instead)
    if (row.item.kind === "folder") return activeIsLink ? undefined : "before";
    const sameList = activeRow.parentId === row.parentId;
    return sameList && activeRow.index < row.index ? "after" : "before";
  };

  const renderRow = (row: Row): ReactNode => {
    if (row.kind === "empty")
      return (
        <li key={row.id} className="hint link-row__empty">
          Empty. Drag links here.
        </li>
      );
    const { item, index, count, parentId } = row;
    return (
      <SortableRow
        key={item.id}
        id={item.id}
        label={labelOf(item)}
        depth={row.depth}
        indicator={indicatorFor(row)}
      >
        {(drag) =>
          item.kind === "link" ? (
            <LinkRow
              {...drag}
              link={item}
              editing={editingId === item.id}
              menu={orderMenu(item, index, count)}
              folderOptions={folderOptions}
              folderId={parentId}
              onEdit={() => setEditingId(item.id)}
              onDone={() => setEditingId(null)}
              onChange={(patch) =>
                change(updateItem<Link>(items, item.id, patch))
              }
              onMoveToFolder={(target) =>
                change(moveLinkTo(items, item.id, target))
              }
            />
          ) : (
            <FolderRow
              {...drag}
              dropTarget={activeIsLink && overId === item.id}
              folder={item}
              editing={editingId === item.id}
              collapsed={collapsed.has(item.id)}
              menu={[
                {
                  label: "Add link here",
                  onSelect: () => {
                    setQuickFolder(item.id);
                    urlRef.current?.focus();
                  },
                },
                ...orderMenu(item, index, count),
              ]}
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
            />
          )
        }
      </SortableRow>
    );
  };

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
        <DndContext
          sensors={sensors}
          collisionDetection={underPointer}
          accessibility={{
            announcements: announcements(items),
            screenReaderInstructions: {
              draggable:
                "To move, press Space, use the arrow keys, then press Space again. Drop on a folder to move a link inside. Press Escape to cancel.",
            },
          }}
          onDragStart={({ active }) => {
            setActiveId(String(active.id));
            setEditingId(null);
          }}
          onDragOver={({ over }) => setOverId(over ? String(over.id) : null)}
          onDragCancel={() => {
            setActiveId(null);
            setOverId(null);
          }}
          onDragEnd={({ active, over }) => {
            setActiveId(null);
            setOverId(null);
            if (!over) return;
            const id = String(active.id);
            change(
              over.id === TOP_LEVEL_ZONE
                ? moveLinkTo(items, id, null)
                : dropOnItem(items, id, String(over.id)),
            );
          }}
        >
          {/* Rows stay still while dragging, so the target under the
              pointer never slides away; a chip follows the pointer */}
          <SortableContext items={rows.map((row) => row.id)} strategy={noShift}>
            <ul className="link-list">{rows.map((row) => renderRow(row))}</ul>
          </SortableContext>
          {draggingNestedLink && <TopLevelZone />}
          <DragOverlay dropAnimation={null}>
            {activeId && (
              <div className="drag-chip">{dragLabel(items, activeId)}</div>
            )}
          </DragOverlay>
        </DndContext>
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

const TOP_LEVEL_ZONE = "top-level-zone";

/** Keep rows in place while dragging; the drop target is shown instead. */
const noShift = () => null;

/**
 * The row under the pointer. Releasing outside the list does nothing (no
 * guessing). Keyboard drags have no pointer, so they use the nearest row.
 */
const underPointer: CollisionDetection = (args) =>
  args.pointerCoordinates ? pointerWithin(args) : closestCenter(args);

interface ItemRow {
  kind: "item";
  id: string;
  item: Item;
  depth: 0 | 1;
  index: number;
  count: number;
  parentId: string | null;
}

type Row = ItemRow | { kind: "empty"; id: string };

function dragLabel(items: readonly Item[], id: string): string {
  const folder = items.find((item) => item.id === id);
  if (folder) return labelOf(folder);
  const link = findLink(items, id);
  return link ? linkLabel(link) : "";
}

function flattenRows(
  items: readonly Item[],
  collapsed: ReadonlySet<string>,
  activeId: string | null,
): Row[] {
  const rows: Row[] = [];
  items.forEach((item, index) => {
    rows.push({
      kind: "item",
      id: item.id,
      item,
      depth: 0,
      index,
      count: items.length,
      parentId: null,
    });
    // A dragged folder carries its links, so hide them while it moves
    if (
      item.kind !== "folder" ||
      collapsed.has(item.id) ||
      activeId === item.id
    )
      return;
    if (item.links.length === 0)
      rows.push({ kind: "empty", id: `${item.id}-empty` });
    item.links.forEach((link, linkIndex) =>
      rows.push({
        kind: "item",
        id: link.id,
        item: link,
        depth: 1,
        index: linkIndex,
        count: item.links.length,
        parentId: item.id,
      }),
    );
  });
  return rows;
}

function labelOf(item: Item): string {
  return item.kind === "folder"
    ? `folder ${item.name || "Folder"}`
    : linkLabel(item);
}

function announcements(items: readonly Item[]): Announcements {
  const name = (id: UniqueIdentifier) => {
    if (id === TOP_LEVEL_ZONE) return "the top level";
    const folder = items.find((item) => item.id === id);
    if (folder) return labelOf(folder);
    const link = findLink(items, String(id));
    return link ? linkLabel(link) : "item";
  };
  return {
    onDragStart: ({ active }) => `Picked up ${name(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over ? `${name(active.id)} is over ${name(over.id)}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? `Dropped ${name(active.id)} on ${name(over.id)}.`
        : `Dropped ${name(active.id)}.`,
    onDragCancel: ({ active }) => `Cancelled moving ${name(active.id)}.`,
  };
}

function SortableRow({
  id,
  label,
  depth,
  indicator,
  children,
}: {
  id: string;
  label: string;
  depth: 0 | 1;
  indicator?: "before" | "after";
  children: (drag: DragProps) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({ id });
  return children({
    bindRow: setNodeRef,
    depth,
    dragging: isDragging,
    indicator,
    handle: (
      <button
        type="button"
        className="drag-handle"
        aria-label={`Drag ${label}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={15} aria-hidden />
      </button>
    ),
  });
}

function TopLevelZone() {
  const { setNodeRef, isOver } = useDroppable({ id: TOP_LEVEL_ZONE });
  return (
    <div
      ref={setNodeRef}
      className={`top-level-zone${isOver ? " top-level-zone--over" : ""}`}
    >
      Drop here to move out of the folder
    </div>
  );
}
