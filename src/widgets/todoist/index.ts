import { isRecord } from "@/core/storage/guards";
import { defineWidget } from "@/core/widgets/types";

import Todoist from "./Todoist";
import TodoistSettings from "./TodoistSettings";
import type { TodoistView } from "./views";

/** The API token is stored separately (see storage.ts), never in here. */
export interface TodoistData {
  /** "" uses the view's name. */
  title: string;
  /** What is listed: Today, Inbox, a project, a label, a filter… */
  view: TodoistView;
  maxTasks: number;
  /** Given to new tasks typed without a date; "" leaves them undated. */
  defaultDue: string;
  /** px */
  width: number;
  /** Tasks hidden from onlookers; remembered across new tabs. */
  hidden: boolean;
  /** Every new tab starts hidden; showing lasts for that tab only. */
  hideOnOpen: boolean;
  /** Which password, if any, showing hidden tasks asks for. */
  showPassword: ShowPassword;
}

export type ShowPassword = "none" | "weborg" | "separate";

export const todoistWidget = defineWidget<TodoistData>({
  type: "todoist",
  name: "Todoist",
  description: "Your Todoist tasks: check them off or add new ones.",
  defaultData: {
    title: "",
    view: { kind: "today" },
    maxTasks: 8,
    defaultDue: "today",
    width: 340,
    hidden: false,
    hideOnOpen: false,
    showPassword: "none",
  },
  dataVersion: 2,
  migrations: {
    // v2: a filter string became a view; the old default is the Today view
    2: (old) => {
      if (!isRecord(old)) return old;
      const { filter, title, ...rest } = old;
      const query = typeof filter === "string" ? filter.trim() : "";
      const view: TodoistView =
        query.toLowerCase() === "today | overdue"
          ? { kind: "today" }
          : { kind: "filter", query };
      return {
        ...rest,
        view,
        title: title === "Today" && view.kind === "today" ? "" : title,
      };
    },
  },
  Component: Todoist,
  Settings: TodoistSettings,
});
