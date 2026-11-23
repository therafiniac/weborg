import { useEffect } from "react";

import { useStorageItem } from "@/core/storage/useStorageItem";

import { fetchProjects, type TodoistProject } from "./api";
import { projectsItem } from "./storage";

/** Projects rarely change; refresh at most this often. */
const PROJECTS_TTL_MS = 6 * 60 * 60 * 1000;

const EMPTY: TodoistProject[] = [];

/** Cached project list. Failures only mean less highlighting, so are ignored. */
export function useProjects(token: string): TodoistProject[] {
  const [cached] = useStorageItem(projectsItem);
  const fetchedAt = cached === undefined ? undefined : (cached?.fetchedAt ?? 0);

  useEffect(() => {
    // undefined: storage not read yet
    if (fetchedAt === undefined || Date.now() - fetchedAt < PROJECTS_TTL_MS)
      return;
    fetchProjects(token)
      .then((projects) =>
        projectsItem.setValue({ projects, fetchedAt: Date.now() }),
      )
      .catch((error: unknown) =>
        console.warn("Weborg: could not load Todoist projects", error),
      );
  }, [token, fetchedAt]);

  return cached?.projects ?? EMPTY;
}
