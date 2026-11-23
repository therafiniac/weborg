import { Plus } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import {
  quickAdd,
  taskUrl,
  updateTask,
  type TodoistProject,
  type TodoistTask,
} from "./api";
import SmartInput from "./SmartInput";
import { prepareQuickAdd } from "./syntax";

const NOTICE_MS = 8000;

export interface AddedNotice {
  task: TodoistTask;
  where: string;
}

/** "Added to Work, tomorrow" */
export function whereAdded(
  task: TodoistTask,
  projects: TodoistProject[],
): string {
  const project = projects.find((p) => p.id === task.projectId);
  return [project?.name ?? "Inbox", task.due?.string]
    .filter(Boolean)
    .join(", ");
}

/** The quick add box: one line of Quick Add text, plus a button for the full form. */
export default function AddTask({
  token,
  projects,
  defaultDue,
  notice,
  onNotice,
  onAdded,
  onOpenForm,
  onError,
}: {
  token: string;
  projects: TodoistProject[];
  /** Used when the text has no date; "" for none. */
  defaultDue: string;
  notice: AddedNotice | null;
  onNotice: (notice: AddedNotice | null) => void;
  /** Reloads the list; resolves whether the new task is now shown. */
  onAdded: (task: TodoistTask) => Promise<boolean>;
  onOpenForm: () => void;
  onError: (error: unknown) => void;
}) {
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const [focused, setFocused] = useState(false);
  const names = projects.map((project) => project.name);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => onNotice(null), NOTICE_MS);
    return () => clearTimeout(timer);
  }, [notice, onNotice]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || adding) return;
    setAdding(true);
    onNotice(null);
    try {
      let { task } = await quickAdd(token, prepareQuickAdd(text, names));
      // Quick Add takes text only, so the default date is set after
      const fallback = defaultDue.trim();
      if (!task.due && fallback)
        task = await updateTask(token, task.id, {
          due: { kind: "text", text: fallback },
        });
      setDraft("");
      if (!(await onAdded(task)))
        onNotice({ task, where: whereAdded(task, projects) });
    } catch (error) {
      onError(error);
    } finally {
      setAdding(false);
    }
  };

  return (
    <form className="todoist__add" onSubmit={(event) => void submit(event)}>
      <div className="todoist__add-row">
        <SmartInput
          aria-label="Add a task"
          placeholder="Add a task…"
          maxLength={500}
          value={draft}
          disabled={adding}
          projectNames={names}
          onChange={(value) => {
            setDraft(value);
            onNotice(null);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <button
          type="button"
          className="todoist__icon-button todoist__add-full"
          aria-label="New task with details"
          title="New task with details"
          onClick={onOpenForm}
        >
          <Plus size={16} />
        </button>
      </div>

      {(focused || draft) && !notice && (
        <p className="todoist__hint">
          tomorrow 5pm · next fri · #project · @label · p1 · // description
        </p>
      )}
    </form>
  );
}

export function AddedMessage({ notice }: { notice: AddedNotice }) {
  return (
    <p className="todoist__hint" role="status">
      Added to {notice.where}.{" "}
      <a href={taskUrl(notice.task.id)} target="_blank" rel="noreferrer">
        Open in Todoist
      </a>
    </p>
  );
}
