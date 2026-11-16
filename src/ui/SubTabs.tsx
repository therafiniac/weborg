import { useId, useRef, type ReactNode } from "react";

import { listIndexForKey } from "./keyboard";

export interface SubTab {
  id: string;
  label: string;
  content: ReactNode;
}

interface Props {
  label: string;
  tabs: readonly SubTab[];
  activeId: string;
  onSelect: (id: string) => void;
}

/** Secondary tabs inside a settings section (WAI-ARIA tabs pattern). */
export default function SubTabs({ label, tabs, activeId, onSelect }: Props) {
  const baseId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0]!;

  return (
    <>
      <div className="subtabs" role="tablist" aria-label={label}>
        {tabs.map((tab, index) => {
          const selected = tab.id === active.id;
          return (
            <button
              key={tab.id}
              ref={(element) => {
                refs.current[index] = element;
              }}
              id={`${baseId}-${tab.id}`}
              type="button"
              role="tab"
              className="subtabs__tab"
              aria-selected={selected}
              aria-controls={`${baseId}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onSelect(tab.id)}
              onKeyDown={(event) => {
                const next = listIndexForKey(event.key, index, tabs.length);
                if (next === null) return;
                event.preventDefault();
                onSelect(tabs[next]!.id);
                refs.current[next]?.focus();
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-${active.id}`}
      >
        {active.content}
      </div>
    </>
  );
}
