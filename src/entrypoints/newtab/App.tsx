import { Archive, Image, KeyRound, LayoutGrid, Type } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import Background from "@/app/Background";
import Dashboard from "@/app/Dashboard";
import PageControls from "@/app/PageControls";
import AppearanceSettings from "@/app/settings/AppearanceSettings";
import BackgroundSettings from "@/app/settings/BackgroundSettings";
import DataSettings from "@/app/settings/DataSettings";
import PasswordSettings from "@/app/settings/PasswordSettings";
import SettingsPanel from "@/app/settings/SettingsPanel";
import WidgetList from "@/app/settings/WidgetList";
import WidgetSection from "@/app/settings/WidgetSection";
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
import { useApplyTheme, useResolvedTheme } from "@/core/appearance/theme";
import { useStorageItem } from "@/core/storage/useStorageItem";
import { widgets } from "@/widgets";

export default function App() {
  const [stored, setStored] = useStorageItem(settingsItem);
  const [storedBackground, setStoredBackground] =
    useStorageItem(backgroundItem);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const closeSettings = useCallback(() => setSettingsOpen(false), []);

  // Return focus to the gear button once it is back on screen
  const wasOpen = useRef(false);
  useEffect(() => {
    if (wasOpen.current && !settingsOpen) toggleRef.current?.focus();
    wasOpen.current = settingsOpen;
  }, [settingsOpen]);

  const theme = useResolvedTheme(
    stored === undefined
      ? "system"
      : normalizeSettings(stored).appearance.theme,
  );
  useApplyTheme(theme);

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
      <Background settings={background} theme={theme} />
      <h1 className="visually-hidden">Weborg</h1>
      <Dashboard settings={settings} />

      {!settingsOpen && (
        <PageControls
          ui={settings.ui}
          theme={theme}
          onToggleTheme={() =>
            saveSettings({
              ...settings,
              appearance: {
                ...settings.appearance,
                // From "system" too: switch to the opposite of what shows
                theme: theme === "dark" ? "light" : "dark",
              },
            })
          }
          settingsRef={toggleRef}
          onOpenSettings={() => setSettingsOpen(true)}
          onChange={(ui) => saveSettings({ ...settings, ui })}
        />
      )}

      {settingsOpen && (
        <SettingsPanel
          onClose={closeSettings}
          sections={[
            {
              id: "background",
              label: "Background",
              icon: Image,
              content: (
                <BackgroundSettings
                  settings={background}
                  onChange={saveBackground}
                />
              ),
            },
            {
              id: "appearance",
              label: "Appearance",
              icon: Type,
              content: (
                <AppearanceSettings
                  appearance={settings.appearance}
                  onChange={(appearance) =>
                    saveSettings({ ...settings, appearance })
                  }
                />
              ),
            },
            // Widgets with lots of options get their own tab (e.g. Links)
            ...widgets
              .filter((definition) => definition.settingsSection)
              .map((definition) => ({
                id: definition.type,
                label: definition.settingsSection!.label,
                icon: definition.settingsSection!.icon,
                content: (
                  <WidgetSection
                    definition={definition}
                    settings={settings}
                    onChange={saveSettings}
                  />
                ),
              })),
            {
              id: "widgets",
              label: "Widgets",
              icon: LayoutGrid,
              content: (
                <WidgetList settings={settings} onChange={saveSettings} />
              ),
            },
            {
              id: "password",
              label: "Password",
              icon: KeyRound,
              content: <PasswordSettings />,
            },
            {
              id: "backup",
              label: "Backup",
              icon: Archive,
              content: <DataSettings />,
            },
          ]}
        />
      )}
    </main>
  );
}
