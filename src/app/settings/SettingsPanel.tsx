import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

import "./SettingsPanel.css";

interface Props {
  onClose: () => void;
  children: ReactNode;
}

/**
 * Non-modal side panel, so changes preview live on the page behind it.
 * Esc closes it; focus moves in on open (the caller restores it on close).
 */
export default function SettingsPanel({ onClose, children }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <aside
      className="settings-panel"
      role="dialog"
      aria-labelledby="settings-title"
    >
      <header className="settings-panel__header">
        <h2 id="settings-title" ref={headingRef} tabIndex={-1}>
          Settings
        </h2>
        <button
          type="button"
          className="icon-button"
          onClick={onClose}
          aria-label="Close settings"
        >
          <X size={18} aria-hidden />
        </button>
      </header>
      {children}
    </aside>
  );
}

export function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="settings-section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}
