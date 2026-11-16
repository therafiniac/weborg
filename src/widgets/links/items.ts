import type { Folder, Item, Link } from "./model";

/** Pure updates on the link tree. Ids are unique across all levels. */

const isFolder = (item: Item): item is Folder => item.kind === "folder";

export function findLink(items: readonly Item[], id: string): Link | undefined {
  for (const item of items) {
    if (item.kind === "link" && item.id === id) return item;
    if (isFolder(item)) {
      const found = item.links.find((link) => link.id === id);
      if (found) return found;
    }
  }
  return undefined;
}

/** Folder id containing the link, null for top level, undefined if absent. */
export function parentOf(
  items: readonly Item[],
  id: string,
): string | null | undefined {
  if (items.some((item) => item.id === id)) return null;
  return items.find(
    (item): item is Folder =>
      isFolder(item) && item.links.some((link) => link.id === id),
  )?.id;
}

export function addItem(
  items: readonly Item[],
  item: Item,
  folderId: string | null = null,
): Item[] {
  if (folderId === null) return [...items, item];
  if (item.kind === "folder") return [...items]; // no nesting
  return items.map((entry) =>
    entry.id === folderId && isFolder(entry)
      ? { ...entry, links: [...entry.links, item] }
      : entry,
  );
}

export function updateItem<T extends Item>(
  items: readonly Item[],
  id: string,
  patch: Partial<Omit<T, "kind" | "id">>,
): Item[] {
  return items.map((item) => {
    if (item.id === id) return { ...item, ...patch } as Item;
    if (isFolder(item) && item.links.some((link) => link.id === id))
      return {
        ...item,
        links: item.links.map((link) =>
          link.id === id ? { ...link, ...patch } : link,
        ),
      };
    return item;
  });
}

export function removeItem(items: readonly Item[], id: string): Item[] {
  return items
    .filter((item) => item.id !== id)
    .map((item) =>
      isFolder(item) && item.links.some((link) => link.id === id)
        ? { ...item, links: item.links.filter((link) => link.id !== id) }
        : item,
    );
}

/** Move an item one step within its own list (top level or folder). */
export function moveItem(
  items: readonly Item[],
  id: string,
  direction: -1 | 1,
): Item[] {
  const swap = <T extends { id: string }>(list: readonly T[]): T[] => {
    const from = list.findIndex((entry) => entry.id === id);
    const to = from + direction;
    if (from === -1 || to < 0 || to >= list.length) return [...list];
    const next = [...list];
    [next[from], next[to]] = [next[to]!, next[from]!];
    return next;
  };

  if (items.some((item) => item.id === id)) return swap(items);
  return items.map((item) =>
    isFolder(item) && item.links.some((link) => link.id === id)
      ? { ...item, links: swap(item.links) }
      : item,
  );
}

/** Move a link into a folder (or to the top level with null), at the end. */
export function moveLinkTo(
  items: readonly Item[],
  linkId: string,
  folderId: string | null,
): Item[] {
  const link = findLink(items, linkId);
  if (!link || parentOf(items, linkId) === folderId) return [...items];
  if (
    folderId !== null &&
    !items.some((item) => item.id === folderId && isFolder(item))
  )
    return [...items];
  return addItem(removeItem(items, linkId), link, folderId);
}

/**
 * Result of dropping one item onto another (drag and drop):
 * - a link dropped on a folder goes into it (at the end);
 * - a link dropped on a link takes its place in that link's list;
 * - a folder only moves among top-level items (dropping it on a nested
 *   link means "where that link's folder is").
 */
export function dropOnItem(
  items: readonly Item[],
  activeId: string,
  overId: string,
): Item[] {
  if (activeId === overId) return [...items];
  const activeParent = parentOf(items, activeId);
  const overParent = parentOf(items, overId);
  if (activeParent === undefined || overParent === undefined) return [...items];

  const active =
    activeParent === null
      ? items.find((item) => item.id === activeId)!
      : findLink(items, activeId)!;

  if (active.kind === "folder") {
    const target = overParent ?? overId;
    const from = items.findIndex((item) => item.id === activeId);
    const to = items.findIndex((item) => item.id === target);
    return to === -1 || from === to ? [...items] : arrayMove(items, from, to);
  }

  const over = items.find((item) => item.id === overId);
  if (over?.kind === "folder") return moveLinkTo(items, activeId, over.id);

  // Same list: move into the hovered link's position
  if (activeParent === overParent) {
    if (activeParent === null) {
      const from = items.findIndex((item) => item.id === activeId);
      const to = items.findIndex((item) => item.id === overId);
      return arrayMove(items, from, to);
    }
    return items.map((item) =>
      item.id === activeParent && isFolder(item)
        ? {
            ...item,
            links: arrayMove(
              item.links,
              item.links.findIndex((link) => link.id === activeId),
              item.links.findIndex((link) => link.id === overId),
            ),
          }
        : item,
    );
  }

  // Different lists: insert before the hovered link
  const link = active;
  const without = removeItem(items, activeId);
  if (overParent === null) {
    const to = without.findIndex((item) => item.id === overId);
    return [...without.slice(0, to), link, ...without.slice(to)];
  }
  return without.map((item) => {
    if (item.id !== overParent || !isFolder(item)) return item;
    const to = item.links.findIndex((l) => l.id === overId);
    return {
      ...item,
      links: [...item.links.slice(0, to), link, ...item.links.slice(to)],
    };
  });
}

function arrayMove<T>(list: readonly T[], from: number, to: number): T[] {
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved!);
  return next;
}
