import {
  DndContext,
  DragOverlay,
  pointerWithin,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  createContext,
  useContext,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { dropOnItem, findLink, moveLinkTo } from "./items";
import type { Item } from "./model";
import { LOOSE_TAB_ID } from "./tabs";
import { linkLabel } from "./url";

const TAB_PREFIX = "tab:";

interface DragState {
  enabled: boolean;
  activeId: string | null;
  overId: string | null;
  activeIsLink: boolean;
}

const DragContext = createContext<DragState>({
  enabled: false,
  activeId: null,
  overId: null,
  activeIsLink: false,
});

interface Props {
  items: Item[];
  enabled: boolean;
  onChange: (items: Item[]) => void;
  /** Overlay styling (tile classes and variables). */
  overlayClassName: string;
  overlayStyle: CSSProperties;
  children: ReactNode;
}

/**
 * Drag and drop for tiles on the page (pointer and touch). Rows do not
 * shift; the target is highlighted instead. Releasing outside a target
 * changes nothing, and the click that ends a drag never opens a link.
 */
export function TileDnd({
  items,
  enabled,
  onChange,
  overlayClassName,
  overlayStyle,
  children,
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const sensors = useSensors(
    // Only start after the pointer moves 8px, so clicks still open links
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  if (!enabled)
    return (
      <DragContext.Provider
        value={{
          enabled: false,
          activeId: null,
          overId: null,
          activeIsLink: false,
        }}
      >
        {children}
      </DragContext.Provider>
    );

  const activeIsLink =
    activeId !== null && findLink(items, activeId) !== undefined;
  const active = activeId
    ? (items.find((item) => item.id === activeId) ?? findLink(items, activeId))
    : undefined;

  return (
    <DragContext.Provider value={{ enabled, activeId, overId, activeIsLink }}>
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={({ active }) => setActiveId(String(active.id))}
        onDragOver={({ over }) => setOverId(over ? String(over.id) : null)}
        onDragCancel={() => {
          setActiveId(null);
          setOverId(null);
        }}
        onDragEnd={({ active, over }) => {
          setActiveId(null);
          setOverId(null);
          suppressNextClick();
          if (!over) return;
          const id = String(active.id);
          const target = String(over.id);
          if (target.startsWith(TAB_PREFIX)) {
            const tab = target.slice(TAB_PREFIX.length);
            onChange(moveLinkTo(items, id, tab === LOOSE_TAB_ID ? null : tab));
          } else {
            onChange(dropOnItem(items, id, target));
          }
        }}
      >
        {children}
        {/* In <body>: the widget's slot uses a transform, which would
            offset a fixed-position overlay */}
        {createPortal(
          <DragOverlay dropAnimation={null}>
            {active && (
              <div
                className={`${overlayClassName} links__overlay`}
                style={overlayStyle}
              >
                <span className="links__item">
                  <span className="links__label">
                    {active.kind === "folder" ? active.name : linkLabel(active)}
                  </span>
                </span>
              </div>
            )}
          </DragOverlay>,
          document.body,
        )}
      </DndContext>
    </DragContext.Provider>
  );
}

/** Swallow the click the browser fires when a drag ends on a tile. */
function suppressNextClick() {
  const handler = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };
  window.addEventListener("click", handler, { capture: true, once: true });
  // If no click follows (released elsewhere), stop listening soon after
  setTimeout(() => window.removeEventListener("click", handler, true), 50);
}

/** Wraps a link or folder tile so it can be dragged and dropped onto. */
export function DraggableTile({
  id,
  isFolder,
  children,
}: {
  id: string;
  isFolder: boolean;
  children: ReactNode;
}) {
  const { enabled, activeId, overId, activeIsLink } = useContext(DragContext);
  if (!enabled) return <>{children}</>;
  return (
    <EnabledTile
      id={id}
      isFolder={isFolder}
      dropInto={isFolder && activeIsLink && overId === id}
      dropBefore={
        overId === id && activeId !== id && !(isFolder && activeIsLink)
      }
    >
      {children}
    </EnabledTile>
  );
}

function EnabledTile({
  id,
  dropInto,
  dropBefore,
  children,
}: {
  id: string;
  isFolder: boolean;
  dropInto: boolean;
  dropBefore: boolean;
  children: ReactNode;
}) {
  const drag = useDraggable({ id });
  const drop = useDroppable({ id });
  return (
    <div
      ref={(element) => {
        drag.setNodeRef(element);
        drop.setNodeRef(element);
      }}
      className={[
        "links__drag",
        drag.isDragging && "links__drag--dragging",
        dropInto && "links__drag--into",
        dropBefore && "links__drag--before",
      ]
        .filter(Boolean)
        .join(" ")}
      {...drag.listeners}
    >
      {children}
    </div>
  );
}

/** Makes a tab accept dropped links (tabs layout). */
export function DroppableTab({
  tabId,
  children,
}: {
  tabId: string;
  children: (isOver: boolean) => ReactNode;
}) {
  const { enabled, activeIsLink } = useContext(DragContext);
  if (!enabled) return <>{children(false)}</>;
  return (
    <EnabledTab tabId={tabId} activeIsLink={activeIsLink}>
      {children}
    </EnabledTab>
  );
}

function EnabledTab({
  tabId,
  activeIsLink,
  children,
}: {
  tabId: string;
  activeIsLink: boolean;
  children: (isOver: boolean) => ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `${TAB_PREFIX}${tabId}` });
  return (
    <div ref={setNodeRef} className="links-tabs__drop">
      {children(isOver && activeIsLink)}
    </div>
  );
}
