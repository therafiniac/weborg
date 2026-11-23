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
  const { id, content, priority, due } = value;
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

export async function addTask(token: string, content: string): Promise<void> {
  await request(token, "/tasks", {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}
