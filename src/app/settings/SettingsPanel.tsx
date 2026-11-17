import {
  Maximize2,
  Minimize2,
  Minus,
  Settings as SettingsIcon,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { listIndexForKey } from "@/ui/keyboard";

import {
  readMode,
  readSection,
  writeMode,
  writeSection,
  type PanelMode,
} from "./panelPrefs";
import "./SettingsPanel.css";

export interface SettingsSectionDef {
  id: string;
  label: string;
  icon: LucideIcon;
  content: ReactNode;
}

interface Props {
  sections: readonly SettingsSectionDef[];
  onClose: () => void;
}

/** Lets a section send the user to another section (e.g. "Edit links"). */
const SettingsNavContext = createContext<(id: string) => void>(() => {});
export const useSettingsNav = () => useContext(SettingsNavContext);

/**
 * Non-modal settings panel, so changes preview live on the page behind it.
 * One section at a time; can be maximised (sidebar layout) or minimised to
 * a corner bar. Esc closes it; the caller restores focus.
 */
export default function SettingsPanel({ sections, onClose }: Props) {
  const baseId = useId();
  const [activeId, setActiveId] = useState(() => {
    const saved = readSection();
    return sections.some((s) => s.id === saved) ? saved! : sections[0]!.id;
  });
  const [mode, setMode] = useState<PanelMode>(readMode);
  const [lastSize, setLastSize] = useState<"normal" | "maximised">(readMode);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const restoreRef = useRef<HTMLButtonElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const active = sections.find((s) => s.id === activeId) ?? sections[0]!;

  useEffect(() => {
    if (mode === "minimised") restoreRef.current?.focus();
    else headingRef.current?.focus();
  }, [mode]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const selectSection = (id: string) => {
    setActiveId(id);
    writeSection(id);
  };

  const resize = (size: "normal" | "maximised") => {
    setMode(size);
    setLastSize(size);
    writeMode(size);
  };

  if (mode === "minimised")
    return (
      <div
        className="settings-mini"
        role="dialog"
        aria-label={`Settings, minimised: ${active.label}`}
      >
        <SettingsIcon size={16} aria-hidden />
        <span className="settings-mini__label">Settings · {active.label}</span>
        <button
          ref={restoreRef}
          type="button"
          className="icon-button"
          aria-label="Restore settings"
          onClick={() => setMode(lastSize)}
        >
          <Maximize2 size={16} aria-hidden />
        </button>
        <button
          type="button"
          className="icon-button"
          aria-label="Close settings"
          onClick={onClose}
        >
          <X size={16} aria-hidden />
        </button>
      </div>
    );

  const maximised = mode === "maximised";
  const tabId = (id: string) => `${baseId}-tab-${id}`;
  const panelId = `${baseId}-panel`;

  return (
    <aside
      className={`settings-panel${maximised ? " settings-panel--maximised" : ""}`}
      role="dialog"
      aria-labelledby={`${baseId}-title`}
    >
      <header className="settings-panel__header">
        <h2 id={`${baseId}-title`} ref={headingRef} tabIndex={-1}>
          Settings
        </h2>
        <div className="settings-panel__actions">
          <button
            type="button"
            className="icon-button"
            aria-label="Minimise settings"
            title="Minimise"
            onClick={() => setMode("minimised")}
          >
            <Minus size={18} aria-hidden />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label={
              maximised ? "Restore settings size" : "Maximise settings"
            }
            title={maximised ? "Restore size" : "Maximise"}
            onClick={() => resize(maximised ? "normal" : "maximised")}
          >
            {maximised ? (
              <Minimize2 size={16} aria-hidden />
            ) : (
              <Maximize2 size={16} aria-hidden />
            )}
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="Close settings"
            title="Close (Esc)"
            onClick={onClose}
          >
            <X size={18} aria-hidden />
          </button>
        </div>
      </header>

      <div className="settings-panel__layout">
        <div
          className="settings-tabs"
          role="tablist"
          aria-label="Settings sections"
          aria-orientation={maximised ? "vertical" : "horizontal"}
        >
          {sections.map((section, index) => {
            const Icon = section.icon;
            const selected = section.id === active.id;
            return (
              <button
                key={section.id}
                ref={(element) => {
                  tabRefs.current[index] = element;
                }}
                id={tabId(section.id)}
                type="button"
                role="tab"
                className="settings-tabs__tab"
                aria-selected={selected}
                aria-controls={panelId}
                tabIndex={selected ? 0 : -1}
                onClick={() => selectSection(section.id)}
                onKeyDown={(event) => {
                  const next = listIndexForKey(
                    event.key,
                    index,
                    sections.length,
                  );
                  if (next === null) return;
                  event.preventDefault();
                  selectSection(sections[next]!.id);
                  tabRefs.current[next]?.focus();
                }}
              >
                <Icon size={16} aria-hidden />
                <span>{section.label}</span>
              </button>
            );
          })}
        </div>

        <div
          id={panelId}
          className="settings-panel__content"
          role="tabpanel"
          aria-labelledby={tabId(active.id)}
          data-section={active.id}
        >
          <SettingsNavContext.Provider value={selectSection}>
            {active.content}
          </SettingsNavContext.Provider>
        </div>
      </div>
    </aside>
  );
}
