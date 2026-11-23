import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { listIndexForKey } from "@/ui/keyboard";

import type { TodoistProject } from "./api";
import { sameView, type TodoistView } from "./views";

interface Choice {
  view: TodoistView;
  label: string;
  /** Starts a new group with this heading. */
  heading?: string;
}

export function viewChoices(
  current: TodoistView,
  projects: TodoistProject[],
  labels: string[],
): Choice[] {
  const choices: Choice[] = [
    { view: { kind: "inbox" }, label: "Inbox" },
    { view: { kind: "today" }, label: "Today" },
    { view: { kind: "next7" }, label: "Next 7 days" },
    { view: { kind: "upcoming" }, label: "Upcoming" },
  ];
  projects
    .filter((project) => !project.isInbox)
    .forEach((project, index) =>
      choices.push({
        view: { kind: "project", id: project.id },
        label: project.name,
        heading: index === 0 ? "Projects" : undefined,
      }),
    );
  labels.forEach((name, index) =>
    choices.push({
      view: { kind: "label", name },
      label: `@${name}`,
      heading: index === 0 ? "Labels" : undefined,
    }),
  );
  if (current.kind === "filter")
    choices.push({ view: current, label: "Custom filter", heading: "Filter" });
  return choices;
}

/** The widget title: a button that switches the view (menu button pattern). */
export default function ViewMenu({
  title,
  view,
  projects,
  labels,
  onChange,
}: {
  title: string;
  view: TodoistView;
  projects: TodoistProject[];
  labels: string[];
  onChange: (view: TodoistView) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const choices = viewChoices(view, projects, labels);

  useEffect(() => {
    if (!open) return;
    const selected = choices.findIndex((c) => sameView(c.view, view));
    itemRefs.current[Math.max(selected, 0)]?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
    // Focus moves into the menu only when it opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div className="todoist-views" ref={rootRef}>
      <h2 className="todoist__title">
        <button
          ref={triggerRef}
          type="button"
          className="todoist-views__trigger"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`${title}: change view`}
          onClick={() => setOpen(!open)}
        >
          {title}
          <ChevronDown size={14} aria-hidden="true" />
        </button>
      </h2>
      {open && (
        <div
          className="todoist-views__menu"
          role="menu"
          aria-label="Views"
          onKeyDown={(event) => {
            if (event.key === "Escape" || event.key === "Tab") {
              event.preventDefault();
              close();
              return;
            }
            const current = itemRefs.current.findIndex(
              (item) => item === document.activeElement,
            );
            const next = listIndexForKey(event.key, current, choices.length);
            if (next !== null) {
              event.preventDefault();
              itemRefs.current[next]?.focus();
            }
          }}
        >
          {choices.map((choice, index) => (
            <div key={`${choice.label}-${index}`} role="none">
              {choice.heading && (
                <div className="todoist-views__heading" role="presentation">
                  {choice.heading}
                </div>
              )}
              <button
                ref={(element) => {
                  itemRefs.current[index] = element;
                }}
                type="button"
                role="menuitemradio"
                aria-checked={sameView(choice.view, view)}
                tabIndex={-1}
                className="todoist-views__item"
                onClick={() => {
                  onChange(choice.view);
                  close();
                }}
              >
                <span>{choice.label}</span>
                {sameView(choice.view, view) && (
                  <Check size={14} aria-hidden="true" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
