import { Download, RotateCcw, Upload } from "lucide-react";
import { useRef, useState } from "react";

import {
  BackupError,
  createBackup,
  MAX_BACKUP_BYTES,
  parseBackup,
  resetAll,
  restoreBackup,
} from "@/core/storage/backup";

type Status = { kind: "ok" | "error"; message: string } | null;

export default function DataSettings() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>(null);

  const handleExport = async () => {
    try {
      const backup = await createBackup();
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(backup, null, 2)], {
          type: "application/json",
        }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `weborg-backup-${backup.exportedAt.slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setStatus({ kind: "ok", message: "Backup downloaded." });
    } catch (error) {
      console.error("Weborg: export failed", error);
      setStatus({ kind: "error", message: "Could not create the backup." });
    }
  };

  const handleImport = async (file: File | undefined) => {
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    if (file.size > MAX_BACKUP_BYTES) {
      setStatus({ kind: "error", message: "That file is too large." });
      return;
    }
    try {
      const backup = parseBackup(await file.text());
      if (!confirm("Replace all your current settings with this backup?"))
        return;
      await restoreBackup(backup);
      setStatus({ kind: "ok", message: "Backup restored." });
    } catch (error) {
      if (!(error instanceof BackupError))
        console.error("Weborg: import failed", error);
      setStatus({
        kind: "error",
        message:
          error instanceof BackupError
            ? error.message
            : "Could not restore the backup.",
      });
    }
  };

  const handleReset = async () => {
    if (
      !confirm(
        "Delete all Weborg settings, widgets and your background image? This cannot be undone.",
      )
    )
      return;
    try {
      await resetAll();
      setStatus({ kind: "ok", message: "Everything was reset." });
    } catch (error) {
      console.error("Weborg: reset failed", error);
      setStatus({ kind: "error", message: "Could not reset." });
    }
  };

  return (
    <>
      <p className="hint">
        Backups include settings and widget content, but not your background
        image.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        <button
          type="button"
          className="button"
          onClick={() => void handleExport()}
        >
          <Download size={16} aria-hidden /> Export
        </button>
        <button
          type="button"
          className="button"
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={16} aria-hidden /> Import
        </button>
        <button
          type="button"
          className="button button--danger"
          onClick={() => void handleReset()}
        >
          <RotateCcw size={16} aria-hidden /> Reset
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="visually-hidden"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => void handleImport(event.target.files?.[0])}
      />
      <p className="hint" role="status" style={{ marginTop: "0.75rem" }}>
        {status?.message}
      </p>
    </>
  );
}
