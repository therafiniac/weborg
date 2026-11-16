import { useEffect, useRef, useState } from "react";

import type { WidgetProps } from "@/core/widgets/types";

import { MAX_NOTE_LENGTH, type NotesData } from ".";
import "./Notes.css";

const SAVE_DELAY_MS = 500;

export default function Notes({ data, setData }: WidgetProps<NotesData>) {
  // Local draft while typing; null means "show the saved text"
  const [draft, setDraft] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const latest = useRef({ data, draft, setData });

  useEffect(() => {
    latest.current = { data, draft, setData };
  });

  const flush = () => {
    clearTimeout(timer.current);
    const { data, draft, setData } = latest.current;
    if (draft !== null && draft !== data.text)
      setData({ ...data, text: draft });
  };

  // Save pending text when the widget unmounts or the tab closes
  useEffect(() => {
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, []);

  const handleChange = (text: string) => {
    setDraft(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, SAVE_DELAY_MS);
  };

  return (
    <textarea
      className="notes"
      aria-label="Notes"
      placeholder="Write something…"
      maxLength={MAX_NOTE_LENGTH}
      rows={data.rows}
      style={{ width: `min(${data.width}px, 90vw)` }}
      value={draft ?? data.text}
      onChange={(event) => handleChange(event.target.value)}
      onBlur={() => {
        flush();
        setDraft(null);
      }}
    />
  );
}
