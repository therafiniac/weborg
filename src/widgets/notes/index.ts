import { defineWidget } from "@/core/widgets/types";

import Notes from "./Notes";
import NotesSettings from "./NotesSettings";

export interface NotesData {
  text: string;
  /** px */
  width: number;
  rows: number;
}

export const MAX_NOTE_LENGTH = 20_000;

export const notesWidget = defineWidget<NotesData>({
  type: "notes",
  name: "Notes",
  description: "A scratchpad that saves as you type.",
  defaultData: { text: "", width: 320, rows: 8 },
  dataVersion: 1,
  Component: Notes,
  Settings: NotesSettings,
});
