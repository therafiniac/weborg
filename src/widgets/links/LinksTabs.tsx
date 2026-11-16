import { useEffect, useId, useRef, useState, type CSSProperties } from "react";

import { NamedIcon } from "./icons";
import LinkTile from "./LinkTile";
import AddLinkPopover from "./AddLinkPopover";
import AddLinkTile from "./AddLinkTile";
import type { Link, LinksData } from "./model";
import { activeTabOf, buildTabs, LOOSE_TAB_ID, tabIndexForKey } from "./tabs";
import { useNumberShortcuts } from "./useNumberShortcuts";

const HOVER_DELAY_MS = 150;

interface Props {
  data: LinksData;
  setData: (data: LinksData) => void;
  /** Tile classes for the grid inside the panel. */
  className: string;
  style: CSSProperties;
  onOpenLink: (index: number, links: LinksData["items"]) => void;
  onAddLink: (link: Link, folderId: string | null) => void;
}

/** Folders as tabs; the active tab's links fill the panel below. */
export default function LinksTabs({
  data,
  setData,
  className,
  style,
  onOpenLink,
  onAddLink,
}: Props) {
  const baseId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const [addAnchor, setAddAnchor] = useState<HTMLElement | null>(null);
  const addTileRef = useRef<HTMLButtonElement>(null);
  const tabs = buildTabs(data.items);
  const active = activeTabOf(tabs, data.activeTab);

  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  useNumberShortcuts(data.shortcuts, (index) => {
    if (active) onOpenLink(index, active.links);
  });

  const select = (id: string) => {
    if (id !== active?.id) setData({ ...data, activeTab: id });
  };

  const addTile = (label: string) =>
    data.showAddTile && (
      <AddLinkTile
        ref={addTileRef}
        label={label}
        expanded={addAnchor !== null}
        onClick={() => setAddAnchor(addAnchor ? null : addTileRef.current)}
      />
    );
  const addPopover = (folderId: string | null, title: string) =>
    addAnchor && (
      <AddLinkPopover
        anchor={addAnchor}
        folderId={folderId}
        title={title}
        style={style}
        onAdd={onAddLink}
        onClose={() => setAddAnchor(null)}
      />
    );

  if (tabs.length === 0 || !active)
    return data.showAddTile ? (
      <div className={className} style={style}>
        {addTile("Add a link")}
        {addPopover(null, "Add a link")}
      </div>
    ) : (
      <p className="links__empty">Add links in settings.</p>
    );

  // Links in the "Links" tab live at the top level
  const targetFolder = active.id === LOOSE_TAB_ID ? null : active.id;
  const addLabel =
    targetFolder === null ? "Add a link" : `Add a link to ${active.name}`;
  const tileCount = active.links.length + (data.showAddTile ? 1 : 0);
  const columns = Math.max(1, Math.min(data.columns, tileCount));
  const panelId = `${baseId}-panel`;
  const tabId = (id: string) => `${baseId}-tab-${id}`;
  const plain = className.includes("links--plain");

  return (
    <div
      className={`links-tabs ${plain ? "links-tabs--plain" : ""}`}
      style={style}
    >
      <div
        className="links-tabs__list"
        role="tablist"
        aria-label="Link folders"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(element) => {
              tabRefs.current[index] = element;
            }}
            id={tabId(tab.id)}
            type="button"
            role="tab"
            className="links-tabs__tab"
            aria-selected={tab.id === active.id}
            aria-controls={panelId}
            tabIndex={tab.id === active.id ? 0 : -1}
            onClick={() => select(tab.id)}
            onPointerEnter={() => {
              if (data.tabSwitch !== "hover") return;
              clearTimeout(hoverTimer.current);
              hoverTimer.current = setTimeout(
                () => select(tab.id),
                HOVER_DELAY_MS,
              );
            }}
            onPointerLeave={() => clearTimeout(hoverTimer.current)}
            onKeyDown={(event) => {
              const next = tabIndexForKey(event.key, index, tabs.length);
              if (next === null) return;
              event.preventDefault();
              select(tabs[next]!.id);
              tabRefs.current[next]?.focus();
            }}
          >
            <span className="links__icon">
              <NamedIcon name={tab.icon} />
            </span>
            <span className="links-tabs__name">{tab.name}</span>
            <span className="links-tabs__count" aria-hidden>
              {tab.links.length}
            </span>
          </button>
        ))}
      </div>

      <div
        id={panelId}
        className="links-tabs__panel"
        role="tabpanel"
        aria-labelledby={tabId(active.id)}
        tabIndex={0}
      >
        {tileCount === 0 ? (
          <p className="links-tabs__empty">
            {active.name} is empty. Add links to it in settings.
          </p>
        ) : (
          <nav
            key={active.id}
            className={`${className} links-tabs__grid`}
            aria-label={active.name}
            style={{ "--links-columns": String(columns) } as CSSProperties}
          >
            {active.links.map((link, index) => (
              <LinkTile
                key={link.id}
                link={link}
                number={data.shortcuts && index < 9 ? index + 1 : undefined}
                openInNewTab={data.openInNewTab}
                favicons={data.favicons}
              />
            ))}
            {addTile(addLabel)}
          </nav>
        )}
        {addPopover(targetFolder, addLabel)}
      </div>
    </div>
  );
}
