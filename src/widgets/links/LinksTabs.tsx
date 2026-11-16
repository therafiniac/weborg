import { useEffect, useId, useRef, type CSSProperties } from "react";

import { NamedIcon } from "./icons";
import LinkTile from "./LinkTile";
import type { LinksData } from "./model";
import { activeTabOf, buildTabs, tabIndexForKey } from "./tabs";
import { useNumberShortcuts } from "./useNumberShortcuts";

const HOVER_DELAY_MS = 150;

interface Props {
  data: LinksData;
  setData: (data: LinksData) => void;
  /** Tile classes for the grid inside the panel. */
  className: string;
  style: CSSProperties;
  onOpenLink: (index: number, links: LinksData["items"]) => void;
}

/** Folders as tabs; the active tab's links fill the panel below. */
export default function LinksTabs({
  data,
  setData,
  className,
  style,
  onOpenLink,
}: Props) {
  const baseId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const tabs = buildTabs(data.items);
  const active = activeTabOf(tabs, data.activeTab);

  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  useNumberShortcuts(data.shortcuts, (index) => {
    if (active) onOpenLink(index, active.links);
  });

  const select = (id: string) => {
    if (id !== active?.id) setData({ ...data, activeTab: id });
  };

  if (tabs.length === 0 || !active)
    return <p className="links__empty">Add links in settings.</p>;

  const columns = Math.max(1, Math.min(data.columns, active.links.length));
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
        {active.links.length === 0 ? (
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
          </nav>
        )}
      </div>
    </div>
  );
}
