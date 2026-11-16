import { Settings as SettingsIcon } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import Dashboard from "@/app/Dashboard";
import SettingsPanel, { SettingsSection } from "@/app/settings/SettingsPanel";
import WidgetList from "@/app/settings/WidgetList";
import {
  normalizeSettings,
  settingsItem,
  type Settings,
} from "@/core/storage/settings";
import { useStorageItem } from "@/core/storage/useStorageItem";

export default function App() {
  const [stored, setStored] = useStorageItem(settingsItem);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const closeSettings = useCallback(() => {
    setSettingsOpen(false);
    toggleRef.current?.focus();
  }, []);

  // Render nothing until settings load, to avoid flashing defaults
  if (stored === undefined) return null;
  const settings = normalizeSettings(stored);

  const saveSettings = (next: Settings) => {
    setStored(next).catch((error: unknown) =>
      console.error("Weborg: failed to save settings", error),
    );
  };

  return (
    <main className="app">
      <h1 className="visually-hidden">Weborg</h1>
      <Dashboard settings={settings} />

      <button
        ref={toggleRef}
        type="button"
        className="settings-toggle"
        aria-label="Open settings"
        aria-expanded={settingsOpen}
        onClick={() => (settingsOpen ? closeSettings() : setSettingsOpen(true))}
      >
        <SettingsIcon size={20} aria-hidden />
      </button>

      {settingsOpen && (
        <SettingsPanel onClose={closeSettings}>
          <SettingsSection title="Widgets">
            <WidgetList settings={settings} onChange={saveSettings} />
          </SettingsSection>
        </SettingsPanel>
      )}
    </main>
  );
}
