import { useEffect } from "react";
import type { WxtStorageItem } from "wxt/utils/storage";

import { useStorageItem } from "@/core/storage/useStorageItem";

import { fetchLabels, fetchProjects, type TodoistProject } from "./api";
import { labelsItem, projectsItem } from "./storage";

/** Projects and labels rarely change; refresh at most this often. */
const TTL_MS = 6 * 60 * 60 * 1000;

const NO_PROJECTS: TodoistProject[] = [];
const NO_LABELS: string[] = [];

type CachedItem = WxtStorageItem<
  { fetchedAt: number } | null,
  Record<string, unknown>
>;

/** Refetch a cached list when stale. Failures only mean less to pick from. */
function useRefresh(
  item: CachedItem,
  refresh: () => Promise<void>,
  /** True for a cache saved in an older shape: refetch at once. */
  outdated: boolean = false,
) {
  const [cached] = useStorageItem(item);
  const fetchedAt =
    cached === undefined ? undefined : outdated ? 0 : (cached?.fetchedAt ?? 0);

  useEffect(() => {
    // undefined: storage not read yet
    if (fetchedAt === undefined || Date.now() - fetchedAt < TTL_MS) return;
    refresh().catch((error: unknown) =>
      console.warn("Weborg: could not load Todoist lists", error),
    );
    // refresh changes identity each render; fetchedAt is what matters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchedAt]);
}

export function useProjects(token: string): TodoistProject[] {
  const [cached] = useStorageItem(projectsItem);
  useRefresh(
    projectsItem as CachedItem,
    async () => {
      const projects = await fetchProjects(token);
      await projectsItem.setValue({ projects, fetchedAt: Date.now() });
    },
    // Saved before the Inbox was marked, so it would show under Projects.
    // Fresh lists always have the field, so this cannot repeat.
    Boolean(cached?.projects.some((project) => !("isInbox" in project))),
  );
  return cached?.projects ?? NO_PROJECTS;
}

export function useLabels(token: string): string[] {
  const [cached] = useStorageItem(labelsItem);
  useRefresh(labelsItem as CachedItem, async () => {
    const labels = await fetchLabels(token);
    await labelsItem.setValue({ labels, fetchedAt: Date.now() });
  });
  return cached?.labels ?? NO_LABELS;
}
