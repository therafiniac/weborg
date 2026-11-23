import {
  Eye,
  EyeOff,
  Lock,
  LockOpen,
  Settings as SettingsIcon,
} from "lucide-react";
import { useEffect, useState, type Ref } from "react";

import { securityItem } from "@/core/security/password";
import type { PageUi } from "@/core/storage/settings";
import { useStorageItem } from "@/core/storage/useStorageItem";
import { PasswordPrompt } from "@/ui/PasswordFields";

import "./PageControls.css";

interface Props {
  ui: PageUi;
  onChange: (ui: PageUi) => void;
  onOpenSettings: () => void;
  settingsRef: Ref<HTMLButtonElement>;
}

/** Bottom-right buttons: show/hide widgets, lock the page, settings. */
export default function PageControls({
  ui,
  onChange,
  onOpenSettings,
  settingsRef,
}: Props) {
  // Spoken (and shown as a hint) after a toggle or a blocked action
  const [message, setMessage] = useState("");
  const [security] = useStorageItem(securityItem);
  const [askingPassword, setAskingPassword] = useState(false);
  const unlockPassword = security?.requireForUnlock ? security.password : null;

  // Hints clear themselves after a few seconds
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  return (
    <div
      className={`page-controls${message || askingPassword ? " page-controls--active" : ""}`}
    >
      <p className="page-controls__message" role="status">
        {message}
      </p>

      {askingPassword && unlockPassword && (
        <div className="page-controls__prompt">
          <PasswordPrompt
            record={unlockPassword}
            label="Password to unlock"
            variant="glass"
            onSuccess={() => {
              setAskingPassword(false);
              onChange({ ...ui, locked: false });
              setMessage("Unlocked");
            }}
            onCancel={() => setAskingPassword(false)}
          />
        </div>
      )}

      <button
        type="button"
        className="page-controls__button"
        aria-pressed={ui.widgetsHidden}
        aria-label={ui.widgetsHidden ? "Show widgets" : "Hide widgets"}
        title={ui.widgetsHidden ? "Show widgets" : "Hide widgets"}
        onClick={() => {
          onChange({ ...ui, widgetsHidden: !ui.widgetsHidden });
          setMessage(ui.widgetsHidden ? "Widgets shown" : "Widgets hidden");
        }}
      >
        {ui.widgetsHidden ? (
          <EyeOff size={20} aria-hidden />
        ) : (
          <Eye size={20} aria-hidden />
        )}
      </button>

      <button
        type="button"
        className="page-controls__button"
        aria-pressed={ui.locked}
        aria-label={ui.locked ? "Unlock page" : "Lock page"}
        title={
          ui.locked
            ? "Locked: click to allow changes"
            : "Lock: prevent changes to this page"
        }
        onClick={() => {
          if (ui.locked && unlockPassword) {
            setAskingPassword((open) => !open);
            return;
          }
          onChange({ ...ui, locked: !ui.locked });
          setMessage(ui.locked ? "Unlocked" : "Locked: no changes allowed");
        }}
      >
        {ui.locked ? (
          <Lock size={20} aria-hidden />
        ) : (
          <LockOpen size={20} aria-hidden />
        )}
      </button>

      <button
        ref={settingsRef}
        type="button"
        className="page-controls__button"
        aria-label="Open settings"
        // aria-disabled keeps it focusable so the reason can be announced
        aria-disabled={ui.locked || undefined}
        title={ui.locked ? "Unlock to change settings" : "Settings"}
        onClick={() => {
          if (ui.locked) setMessage("Unlock to change settings");
          else onOpenSettings();
        }}
      >
        <SettingsIcon size={20} aria-hidden />
      </button>
    </div>
  );
}
