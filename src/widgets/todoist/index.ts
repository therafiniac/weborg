import { defineWidget } from "@/core/widgets/types";

import Todoist from "./Todoist";
import TodoistSettings from "./TodoistSettings";

/** The API token is stored separately (see storage.ts), never in here. */
export interface TodoistData {
  title: string;
  /** Todoist filter query; empty lists every active task. */
  filter: string;
  maxTasks: number;
  /** Given to new tasks typed without a date; "" leaves them undated. */
  defaultDue: string;
  /** px */
  width: number;
  /** Tasks hidden from onlookers; remembered across new tabs. */
  hidden: boolean;
  /** Every new tab starts hidden; showing lasts for that tab only. */
  hideOnOpen: boolean;
}

export const todoistWidget = defineWidget<TodoistData>({
  type: "todoist",
  name: "Todoist",
  description: "Your Todoist tasks: check them off or add new ones.",
  defaultData: {
    title: "Today",
    filter: "today | overdue",
    maxTasks: 8,
    defaultDue: "today",
    width: 340,
    hidden: false,
    hideOnOpen: false,
  },
  dataVersion: 1,
  Component: Todoist,
  Settings: TodoistSettings,
});
