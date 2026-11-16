import Dashboard from "@/app/Dashboard";
import { normalizeSettings, settingsItem } from "@/core/storage/settings";
import { useStorageItem } from "@/core/storage/useStorageItem";

export default function App() {
  const [stored] = useStorageItem(settingsItem);

  // Render nothing until settings load, to avoid flashing defaults
  if (stored === undefined) return null;

  return (
    <main className="app">
      <h1 className="visually-hidden">Weborg</h1>
      <Dashboard settings={normalizeSettings(stored)} />
    </main>
  );
}
