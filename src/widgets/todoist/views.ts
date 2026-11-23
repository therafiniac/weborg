import type { TodoistProject, TodoistTask } from "./api";

/** What the widget lists, mirroring Todoist's sidebar. */
export type TodoistView =
  | { kind: "today" }
  | { kind: "inbox" }
  | { kind: "next7" }
  | { kind: "upcoming" }
  | { kind: "project"; id: string }
  | { kind: "label"; name: string }
  | { kind: "filter"; query: string };

/** How the API is asked for a view's tasks. */
export type ViewQuery =
  | { kind: "filter"; query: string }
  | { kind: "project"; id: string }
  | { kind: "label"; name: string }
  | { kind: "all" };

export function viewQuery(view: TodoistView): ViewQuery {
  switch (view.kind) {
    // Like Todoist, Today and the upcoming views include overdue tasks
    case "today":
      return { kind: "filter", query: "today | overdue" };
    case "next7":
      return { kind: "filter", query: "overdue | 7 days" };
    case "upcoming":
      return { kind: "filter", query: "!no date" };
    case "inbox":
      return { kind: "filter", query: "#Inbox" };
    case "project":
      return { kind: "project", id: view.id };
    case "label":
      return { kind: "label", name: view.name };
    case "filter":
      return view.query.trim()
        ? { kind: "filter", query: view.query.trim() }
        : { kind: "all" };
  }
}

/** Stable key for caching a view's tasks. */
export const viewKey = (view: TodoistView): string => JSON.stringify(view);

export function viewName(
  view: TodoistView,
  projects: TodoistProject[],
): string {
  switch (view.kind) {
    case "today":
      return "Today";
    case "inbox":
      return "Inbox";
    case "next7":
      return "Next 7 days";
    case "upcoming":
      return "Upcoming";
    case "project":
      return projects.find((p) => p.id === view.id)?.name ?? "Project";
    case "label":
      return `@${view.name}`;
    case "filter":
      return view.query.trim() ? "Filter" : "All tasks";
  }
}

/** "today", "project:123", "label:home", "filter": for <select> values. */
export function encodeView(view: TodoistView): string {
  if (view.kind === "project") return `project:${view.id}`;
  if (view.kind === "label") return `label:${view.name}`;
  return view.kind;
}

export function decodeView(value: string, filterQuery = ""): TodoistView {
  if (value.startsWith("project:"))
    return { kind: "project", id: value.slice("project:".length) };
  if (value.startsWith("label:"))
    return { kind: "label", name: value.slice("label:".length) };
  if (value === "filter") return { kind: "filter", query: filterQuery };
  if (value === "inbox" || value === "next7" || value === "upcoming")
    return { kind: value };
  return { kind: "today" };
}

export const sameView = (a: TodoistView, b: TodoistView) =>
  viewKey(a) === viewKey(b);

// --- Dates -------------------------------------------------------------

/** Local calendar date as YYYY-MM-DD. */
export function localDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const dayOf = (due: string) => due.slice(0, 10);
const hasTime = (due: string) => due.length > 10;

function parseDay(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

const daysBetween = (from: string, to: string) =>
  Math.round((parseDay(to).getTime() - parseDay(from).getTime()) / 86_400_000);

export const isOverdue = (task: TodoistTask, today: string) =>
  Boolean(task.due && dayOf(task.due.date) < today);

/** "Today", "Tomorrow", "Wednesday", "21 Nov", "3 Feb 2027". */
export function dayLabel(day: string, today: string): string {
  const diff = daysBetween(today, day);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  const date = parseDay(day);
  if (diff > 1 && diff < 7)
    return new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(date);
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    ...(day.slice(0, 4) !== today.slice(0, 4) && { year: "numeric" }),
  }).format(date);
}

/** "5:00 PM" for tasks with a time; "" otherwise. */
export function timeLabel(due: string): string {
  if (!hasTime(due)) return "";
  // Times ending in Z are fixed UTC instants; others are floating local times
  const date = due.endsWith("Z")
    ? new Date(due)
    : new Date(`${due.slice(0, 19)}`);
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

/**
 * The due text a row shows: only what its view does not already say.
 * Today and the day-grouped views already name the day, so they show just
 * the time, except for overdue tasks, which show their date.
 */
export function dueText(
  task: TodoistTask,
  view: TodoistView,
  today: string,
): string {
  if (!task.due) return "";
  const day = dayOf(task.due.date);
  const time = timeLabel(task.due.date);
  const groupedByDay =
    view.kind === "today" || view.kind === "next7" || view.kind === "upcoming";
  if (groupedByDay && day >= today) return time;
  return [dayLabel(day, today), time].filter(Boolean).join(" ");
}

/** Project and Inbox views need not repeat the project on every row. */
export const showsProject = (view: TodoistView) =>
  view.kind !== "project" && view.kind !== "inbox";

export interface TaskGroup {
  /** null: no heading */
  title: string | null;
  overdue: boolean;
  tasks: TodoistTask[];
}

/** Sections as Todoist shows them: Overdue first, then Today or each day. */
export function groupTasks(
  tasks: TodoistTask[],
  view: TodoistView,
  today: string,
): TaskGroup[] {
  if (
    view.kind !== "today" &&
    view.kind !== "next7" &&
    view.kind !== "upcoming"
  )
    return tasks.length ? [{ title: null, overdue: false, tasks }] : [];

  const overdue = tasks.filter((task) => isOverdue(task, today));
  const rest = tasks.filter((task) => !isOverdue(task, today));
  const groups: TaskGroup[] = [];
  if (overdue.length)
    groups.push({ title: "Overdue", overdue: true, tasks: overdue });

  if (view.kind === "today") {
    if (rest.length)
      groups.push({ title: "Today", overdue: false, tasks: rest });
    // A lone section needs no heading
    if (groups.length === 1 && !overdue.length) groups[0]!.title = null;
    return groups;
  }
  for (const task of rest) {
    const day = task.due ? dayOf(task.due.date) : "";
    const title = day ? dayLabel(day, today) : "No date";
    const last = groups[groups.length - 1];
    if (last && !last.overdue && last.title === title) last.tasks.push(task);
    else groups.push({ title, overdue: false, tasks: [task] });
  }
  return groups;
}
