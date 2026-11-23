import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

const CONFIRM_MS = 4000;

/** Asks once before deleting, so a stray click cannot delete a task. */
export default function DeleteButton({ onDelete }: { onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const timer = setTimeout(() => setConfirming(false), CONFIRM_MS);
    return () => clearTimeout(timer);
  }, [confirming]);

  return (
    <button
      type="button"
      className={`todoist__text-button todoist__text-button--danger${confirming ? " is-confirming" : ""}`}
      onClick={() => (confirming ? onDelete() : setConfirming(true))}
      onBlur={() => setConfirming(false)}
    >
      <Trash2 size={13} />
      {confirming ? "Delete task?" : "Delete"}
    </button>
  );
}
