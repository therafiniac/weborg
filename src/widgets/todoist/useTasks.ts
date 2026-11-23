import { useCallback, useEffect, useRef, useState } from "react";

import { fetchTasks, sortTasks, TodoistError, type TodoistTask } from "./api";
import { cacheItem, saveCache } from "./storage";

/** Filter edits arrive per keystroke; wait before asking Todoist. */
const FILTER_DELAY_MS = 600;
/** Refetch when the tab is shown again after this long. */
const STALE_MS = 60_000;

export interface TasksState {
  tasks: TodoistTask[] | null;
  loading: boolean;
  error: TodoistError | null;
}

export function useTasks(token: string, filter: string) {
  const [state, setState] = useState<TasksState>({
    tasks: null,
    loading: true,
    error: null,
  });
  const fetchedAt = useRef(0);
  const firstLoad = useRef(true);
  // Filter whose fresh tasks are shown; cached ones must not replace them
  const loadedFilter = useRef<string | null>(null);
  // Ignore responses for a token or filter that is no longer current
  const run = useRef(0);

  /** Resolves with the fresh tasks, or null if loading failed. */
  const load = useCallback(async (): Promise<TodoistTask[] | null> => {
    const id = ++run.current;
    firstLoad.current = false;
    setState((s) => ({ ...s, loading: true }));
    try {
      const tasks = await fetchTasks(token, filter);
      if (id !== run.current) return null;
      fetchedAt.current = Date.now();
      loadedFilter.current = filter;
      setState({ tasks, loading: false, error: null });
      saveCache(filter, tasks).catch((error: unknown) =>
        console.error("Weborg: failed to cache Todoist tasks", error),
      );
      return tasks;
    } catch (error) {
      if (id !== run.current) return null;
      setState((s) => ({
        ...s,
        loading: false,
        error:
          error instanceof TodoistError
            ? error
            : new TodoistError("server", "Could not load tasks."),
      }));
      return null;
    }
  }, [token, filter]);

  // Show cached tasks at once, then fetch fresh ones
  useEffect(() => {
    let cancelled = false;
    cacheItem
      .getValue()
      .then((cache) => {
        if (cancelled || loadedFilter.current === filter) return;
        setState((s) => ({ ...s, tasks: cache[filter]?.tasks ?? null }));
      })
      .catch(() => {});
    const delay = firstLoad.current ? 0 : FILTER_DELAY_MS;
    const timer = setTimeout(() => void load(), delay);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [filter, load]);

  useEffect(() => {
    const onVisible = () => {
      if (
        document.visibilityState === "visible" &&
        Date.now() - fetchedAt.current > STALE_MS
      )
        void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load]);

  const removeTask = (id: string) =>
    setState((s) => ({
      ...s,
      tasks: s.tasks?.filter((task) => task.id !== id) ?? null,
    }));

  const restoreTask = (task: TodoistTask) =>
    setState((s) => ({
      ...s,
      tasks: sortTasks([...(s.tasks ?? []), task]),
    }));

  const replaceTask = (task: TodoistTask) =>
    setState((s) => ({
      ...s,
      tasks: s.tasks
        ? sortTasks(s.tasks.map((t) => (t.id === task.id ? task : t)))
        : null,
    }));

  const setError = (error: unknown) =>
    setState((s) => ({
      ...s,
      error:
        error instanceof TodoistError
          ? error
          : new TodoistError("server", "Something went wrong."),
    }));

  return {
    ...state,
    reload: load,
    removeTask,
    restoreTask,
    replaceTask,
    setError,
  };
}
