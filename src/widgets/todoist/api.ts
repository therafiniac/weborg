import { browser } from "wxt/browser";

import { isRecord } from "@/core/storage/guards";

/** Todoist API v1: https://developer.todoist.com/api/v1/ */
const BASE_URL = "https://api.todoist.com/api/v1";

/** Requested only when the user connects, so others never grant it. */
export const TODOIST_ORIGIN = "https://api.todoist.com/*";

export const TOKEN_SETTINGS_URL =
  "https://app.todoist.com/app/settings/integrations/developer";

/** Enough to rank and sort; the API's page limit is 200. */
const FETCH_LIMIT = 50;

export interface TodoistTask {
  id: string;
  content: string;
  /** 1 (normal) to 4 (urgent) */
  priority: number;
  due: { date: string; string: string } | null;
  /** Missing on tasks cached before projects were tracked. */
  projectId?: string;
  /** Missing on tasks cached before these were tracked. */
  description?: string;
  labels?: string[];
}

export type TodoistErrorKind = "auth" | "network" | "rate" | "server";

export class TodoistError extends Error {
  constructor(
    readonly kind: TodoistErrorKind,
    message: string,
  ) {
    super(message);
  }
}

export const taskUrl = (id: string) =>
  `https://app.todoist.com/app/task/${encodeURIComponent(id)}`;

/**
 * Firefox's built-in data consent (Firefox 140+): the token is sent to
 * Todoist, so it is declared as optional data collection in the manifest
 * and requested together with site access. Chrome has no such key.
 */
export const TODOIST_DATA_COLLECTION = ["authenticationInfo"];

type AccessRequest = Parameters<typeof browser.permissions.request>[0] & {
  data_collection?: string[];
};

const accessRequest = (): AccessRequest => ({
  origins: [TODOIST_ORIGIN],
  ...(import.meta.env.FIREFOX && { data_collection: TODOIST_DATA_COLLECTION }),
});

export async function hasHostAccess(): Promise<boolean> {
  return browser.permissions.contains(accessRequest());
}

/** Must run inside a click handler, before any other await. */
export async function requestHostAccess(): Promise<boolean> {
  return browser.permissions.request(accessRequest());
}

async function request(
  token: string,
  path: string,
  init: RequestInit = {},
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
      },
    });
  } catch {
    throw new TodoistError("network", "Could not reach Todoist.");
  }

  if (response.status === 401 || response.status === 403)
    throw new TodoistError("auth", "Todoist rejected the API token.");
  if (response.status === 429)
    throw new TodoistError("rate", "Too many requests. Try again shortly.");
  if (!response.ok)
    throw new TodoistError("server", `Todoist error (${response.status}).`);

  if (response.status === 204) return null;
  try {
    return await response.json();
  } catch {
    throw new TodoistError("server", "Todoist sent an unreadable response.");
  }
}

function parseTask(value: unknown): TodoistTask | null {
  if (!isRecord(value)) return null;
  const { id, content, priority, due, project_id, description, labels } = value;
  if (typeof id !== "string" || typeof content !== "string") return null;
  return {
    id,
    content,
    priority:
      typeof priority === "number" && priority >= 1 && priority <= 4
        ? priority
        : 1,
    due:
      isRecord(due) &&
      typeof due.date === "string" &&
      typeof due.string === "string"
        ? { date: due.date, string: due.string }
        : null,
    ...(typeof project_id === "string" && { projectId: project_id }),
    description: typeof description === "string" ? description : "",
    labels: Array.isArray(labels)
      ? labels.filter((label): label is string => typeof label === "string")
      : [],
  };
}

export function parseTasks(value: unknown): TodoistTask[] {
  if (!isRecord(value) || !Array.isArray(value.results)) return [];
  return value.results
    .map(parseTask)
    .filter((task): task is TodoistTask => task !== null);
}

/** Dated tasks first (earliest first), then by priority, highest first. */
export function sortTasks(tasks: TodoistTask[]): TodoistTask[] {
  return [...tasks].sort((a, b) => {
    if (a.due && b.due) {
      const byDate = a.due.date.localeCompare(b.due.date);
      if (byDate !== 0) return byDate;
    } else if (a.due || b.due) {
      return a.due ? -1 : 1;
    }
    return b.priority - a.priority;
  });
}

/** Empty filter lists every active task. */
export async function fetchTasks(
  token: string,
  filter: string,
): Promise<TodoistTask[]> {
  const query = filter.trim();
  const params = new URLSearchParams({ limit: String(FETCH_LIMIT) });
  if (query) params.set("query", query);
  const path = query ? "/tasks/filter" : "/tasks";
  return sortTasks(parseTasks(await request(token, `${path}?${params}`)));
}

export async function closeTask(token: string, id: string): Promise<void> {
  await request(token, `/tasks/${encodeURIComponent(id)}/close`, {
    method: "POST",
  });
}

/** Todoist's own natural-language parser: dates, #project, @label, p1… */
export async function quickAdd(
  token: string,
  text: string,
): Promise<{ task: TodoistTask; projectId: string | null }> {
  const value = await request(token, "/tasks/quick", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
  const task = parseTask(value);
  if (!task)
    throw new TodoistError("server", "Todoist sent an unreadable task.");
  const projectId =
    isRecord(value) && typeof value.project_id === "string"
      ? value.project_id
      : null;
  return { task, projectId };
}

export type DueChange =
  | { kind: "none" }
  /** YYYY-MM-DD from the date picker */
  | { kind: "date"; date: string }
  /** Natural language, like "tomorrow 5pm" */
  | { kind: "text"; text: string };

export interface TaskChanges {
  content?: string;
  description?: string;
  /** Label names; replaces the task's labels. */
  labels?: string[];
  /** 1 (normal) to 4 (urgent) */
  priority?: number;
  due?: DueChange;
}

function dueFields(due: DueChange): Record<string, string> {
  switch (due.kind) {
    case "none":
      return { due_string: "no date" };
    case "date":
      return { due_date: due.date };
    case "text":
      return { due_string: due.text };
  }
}

export async function updateTask(
  token: string,
  id: string,
  changes: TaskChanges,
): Promise<TodoistTask> {
  const body = {
    ...(changes.content !== undefined && { content: changes.content }),
    ...(changes.description !== undefined && {
      description: changes.description,
    }),
    ...(changes.labels !== undefined && { labels: changes.labels }),
    ...(changes.priority !== undefined && { priority: changes.priority }),
    ...(changes.due && dueFields(changes.due)),
  };
  const task = parseTask(
    await request(token, `/tasks/${encodeURIComponent(id)}`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );
  if (!task)
    throw new TodoistError("server", "Todoist sent an unreadable task.");
  return task;
}

export interface NewTask {
  content: string;
  description: string;
  labels: string[];
  priority: number;
  /** null: the Inbox */
  projectId: string | null;
  due: DueChange;
}

/** Structured create, for the full form; the add box uses quickAdd. */
export async function createTask(
  token: string,
  fields: NewTask,
): Promise<TodoistTask> {
  const body = {
    content: fields.content,
    ...(fields.description && { description: fields.description }),
    ...(fields.labels.length > 0 && { labels: fields.labels }),
    priority: fields.priority,
    ...(fields.projectId && { project_id: fields.projectId }),
    // "no date" is only needed to clear an existing date
    ...(fields.due.kind !== "none" && dueFields(fields.due)),
  };
  const task = parseTask(
    await request(token, "/tasks", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );
  if (!task)
    throw new TodoistError("server", "Todoist sent an unreadable task.");
  return task;
}

export async function deleteTask(token: string, id: string): Promise<void> {
  await request(token, `/tasks/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

/** The update endpoint cannot change projects; this one does. */
export async function moveTask(
  token: string,
  id: string,
  projectId: string,
): Promise<TodoistTask> {
  const task = parseTask(
    await request(token, `/tasks/${encodeURIComponent(id)}/move`, {
      method: "POST",
      body: JSON.stringify({ project_id: projectId }),
    }),
  );
  if (!task)
    throw new TodoistError("server", "Todoist sent an unreadable task.");
  return task;
}

export interface TodoistProject {
  id: string;
  name: string;
  isInbox?: boolean;
}

export async function fetchProjects(token: string): Promise<TodoistProject[]> {
  const value = await request(token, "/projects?limit=200");
  if (!isRecord(value) || !Array.isArray(value.results)) return [];
  return value.results.flatMap((project: unknown) =>
    isRecord(project) &&
    typeof project.id === "string" &&
    typeof project.name === "string"
      ? [
          {
            id: project.id,
            name: project.name,
            isInbox: project.inbox_project === true,
          },
        ]
      : [],
  );
}

export async function fetchLabels(token: string): Promise<string[]> {
  const value = await request(token, "/labels?limit=200");
  if (!isRecord(value) || !Array.isArray(value.results)) return [];
  return value.results.flatMap((label: unknown) =>
    isRecord(label) && typeof label.name === "string" ? [label.name] : [],
  );
}
