import { X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import {
  quickAdd,
  taskUrl,
  updateTask,
  type TodoistProject,
  type TodoistTask,
} from "./api";
import DateButton, { formatPickedDate } from "./DateButton";
import SmartInput from "./SmartInput";
import { prepareQuickAdd } from "./syntax";

const NOTICE_MS = 8000;

interface Notice {
  task: TodoistTask;
  where: string;
}

export default function AddTask({
  token,
  projects,
  defaultDue,
  onAdded,
  onError,
}: {
  token: string;
  projects: TodoistProject[];
  /** Used when the text has no date and none was picked; "" for none. */
  defaultDue: string;
  /** Reloads the list; resolves whether the new task is now shown. */
  onAdded: (task: TodoistTask) => Promise<boolean>;
  onError: (error: unknown) => void;
}) {
  const [draft, setDraft] = useState("");
  const [pickedDate, setPickedDate] = useState("");
  const [adding, setAdding] = useState(false);
  const [focused, setFocused] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const names = projects.map((project) => project.name);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), NOTICE_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || adding) return;
    setAdding(true);
    setNotice(null);
    try {
      const added = await quickAdd(token, prepareQuickAdd(text, names));
      let task = added.task;
      // Quick Add takes text only, so a picked or default date is set after
      const fallback = defaultDue.trim();
      if (pickedDate)
        task = await updateTask(token, task.id, {
          due: { kind: "date", date: pickedDate },
        });
      else if (!task.due && fallback)
        task = await updateTask(token, task.id, {
          due: { kind: "text", text: fallback },
        });
      setDraft("");
      setPickedDate("");
      if (!(await onAdded(task))) {
        const project = projects.find((p) => p.id === added.projectId);
        setNotice({
          task,
          where: [project?.name ?? "Inbox", task.due?.string]
            .filter(Boolean)
            .join(", "),
        });
      }
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
            setNotice(null);
          }}
          onKeyDown={(event) => {
            // The hidden date picker is a second field, which stops browsers
            // submitting on Enter by themselves
            if (event.key === "Enter" && !event.nativeEvent.isComposing) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {pickedDate && (
          <span className="todoist__chip">
            {formatPickedDate(pickedDate)}
            <button
              type="button"
              className="todoist__chip-clear"
              aria-label="Clear date"
              onClick={() => setPickedDate("")}
            >
              <X size={12} />
            </button>
          </span>
        )}
        <DateButton
          label="Pick a date"
          value={pickedDate}
          onChange={setPickedDate}
        />
      </div>

      {(focused || draft) && !notice && (
        <p className="todoist__hint">
          tomorrow 5pm · next fri · #project · @label · p1 · // description
        </p>
      )}

      {notice && (
        <p className="todoist__hint" role="status">
          Added to {notice.where}.{" "}
          <a href={taskUrl(notice.task.id)} target="_blank" rel="noreferrer">
            Open in Todoist
          </a>
        </p>
      )}
    </form>
  );
}
