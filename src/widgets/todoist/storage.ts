import { storage } from "wxt/utils/storage";

import type { TodoistTask } from "./api";

/**
 * Kept apart from widget data so backups never include it, and local so it
 * never syncs. "Reset everything" clears it with the rest of local storage.
 */
export const tokenItem = storage.defineItem<string>("local:todoist-token", {
  fallback: "",
});

export interface CachedTasks {
  tasks: TodoistTask[];
  fetchedAt: number;
}

/** Last tasks per filter, shown while loading or offline. */
export const cacheItem = storage.defineItem<Record<string, CachedTasks>>(
  "local:todoist-cache",
  { fallback: {} },
);

const MAX_CACHED_FILTERS = 5;

export async function saveCache(filter: string, tasks: TodoistTask[]) {
  const current = await cacheItem.getValue();
  const entries = Object.entries({
    ...current,
    [filter]: { tasks, fetchedAt: Date.now() },
  })
    .sort(([, a], [, b]) => b.fetchedAt - a.fetchedAt)
    .slice(0, MAX_CACHED_FILTERS);
  await cacheItem.setValue(Object.fromEntries(entries));
}
