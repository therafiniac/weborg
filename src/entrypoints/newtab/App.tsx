import { Settings as SettingsIcon } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import Background from "@/app/Background";
import Dashboard from "@/app/Dashboard";
import BackgroundSettings from "@/app/settings/BackgroundSettings";
import SettingsPanel, { SettingsSection } from "@/app/settings/SettingsPanel";
import WidgetList from "@/app/settings/WidgetList";
import {
  backgroundItem,
  normalizeBackground,
  type BackgroundSettings as BackgroundValue,
} from "@/core/background/background";
import {
  normalizeSettings,
  settingsItem,
  type Settings,
} from "@/core/storage/settings";
import { useStorageItem } from "@/core/storage/useStorageItem";

export default function App() {
  const [stored, setStored] = useStorageItem(settingsItem);
  const [storedBackground, setStoredBackground] =
    useStorageItem(backgroundItem);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const closeSettings = useCallback(() => {
    setSettingsOpen(false);
    toggleRef.current?.focus();
  }, []);

  // Render nothing until settings load, to avoid flashing defaults
  if (stored === undefined || storedBackground === undefined) return null;
  const settings = normalizeSettings(stored);
  const background = normalizeBackground(storedBackground);

  const saveSettings = (next: Settings) => {
    setStored(next).catch((error: unknown) =>
      console.error("Weborg: failed to save settings", error),
    );
  };

  const saveBackground = (next: BackgroundValue) => {
    setStoredBackground(next).catch((error: unknown) =>
      console.error("Weborg: failed to save background", error),
    );
  };

  return (
    <main className="app">
      <Background settings={background} />
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
          <SettingsSection title="Background">
            <BackgroundSettings
              settings={background}
              onChange={saveBackground}
            />
          </SettingsSection>
          <SettingsSection title="Widgets">
            <WidgetList settings={settings} onChange={saveSettings} />
          </SettingsSection>
        </SettingsPanel>
      )}
    </main>
  );
}
