import { MoreVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { listIndexForKey } from "./keyboard";

export interface MenuItem {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  danger?: boolean;
}

interface Props {
  /** Accessible name of the trigger, e.g. "More actions for GitHub". */
  label: string;
  items: readonly MenuItem[];
}

/** A "⋮" button with a small action menu (WAI-ARIA menu button pattern). */
export default function Menu({ label, items }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const enabled = items
    .map((item, index) => (item.disabled ? -1 : index))
    .filter((index) => index >= 0);

  useEffect(() => {
    if (!open) return;
    itemRefs.current[enabled[0] ?? 0]?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
    // Focus the first item only when the menu opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div className="menu" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="icon-button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <MoreVertical size={16} aria-hidden />
      </button>
      {open && (
        <div
          className="menu__list"
          role="menu"
          aria-label={label}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              close();
              return;
            }
            const current = enabled.indexOf(
              itemRefs.current.indexOf(
                document.activeElement as HTMLButtonElement,
              ),
            );
            const next = listIndexForKey(event.key, current, enabled.length);
            if (next === null) return;
            event.preventDefault();
            itemRefs.current[enabled[next]!]?.focus();
          }}
        >
          {items.map((item, index) => (
            <button
              key={item.label}
              ref={(element) => {
                itemRefs.current[index] = element;
              }}
              type="button"
              role="menuitem"
              className={`menu__item${item.danger ? " menu__item--danger" : ""}`}
              disabled={item.disabled}
              tabIndex={-1}
              onClick={() => {
                close();
                item.onSelect();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
