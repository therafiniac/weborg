import { Circle, RefreshCw } from "lucide-react";
import { useState, type FormEvent } from "react";

import { useStorageItem } from "@/core/storage/useStorageItem";
import type { WidgetProps } from "@/core/widgets/types";

import type { TodoistData } from ".";
import { addTask, closeTask, taskUrl, type TodoistTask } from "./api";
import { tokenItem } from "./storage";
import { useTasks } from "./useTasks";
import "./Todoist.css";

export default function Todoist(props: WidgetProps<TodoistData>) {
  const [token] = useStorageItem(tokenItem);
  if (token === undefined) return null;

  return (
    <section
      className="todoist"
      aria-label="Todoist tasks"
      style={{ width: `min(${props.data.width}px, 90vw)` }}
    >
      {token ? (
        <TaskList token={token} {...props} />
      ) : (
        <p className="todoist__message">
          Connect Todoist in this widget's settings.
        </p>
      )}
    </section>
  );
}

function TaskList({
  token,
  data,
}: WidgetProps<TodoistData> & { token: string }) {
  const { tasks, loading, error, reload, removeTask, restoreTask, setError } =
    useTasks(token, data.filter);
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);

  const complete = async (task: TodoistTask) => {
    removeTask(task.id);
    try {
      await closeTask(token, task.id);
    } catch (error) {
      restoreTask(task);
      setError(error);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || adding) return;
    setAdding(true);
    try {
      await addTask(token, content);
      setDraft("");
      await reload();
    } catch (error) {
      setError(error);
    } finally {
      setAdding(false);
    }
  };

  const shown = tasks?.slice(0, data.maxTasks) ?? [];

  return (
    <>
      <header className="todoist__header">
        <h2 className="todoist__title">{data.title || "Tasks"}</h2>
        <button
          type="button"
          className="todoist__icon-button"
          aria-label="Refresh tasks"
          disabled={loading}
          onClick={() => void reload()}
        >
          <RefreshCw size={14} className={loading ? "todoist__spin" : ""} />
        </button>
      </header>

      {error && (
        <p className="todoist__message todoist__message--error" role="alert">
          {error.kind === "auth"
            ? "Todoist rejected the token. Update it in settings."
            : error.kind === "network" && tasks
              ? "Offline. Showing saved tasks."
              : error.message}
        </p>
      )}

      {tasks === null ? (
        loading && <p className="todoist__message">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="todoist__message">Nothing to do.</p>
      ) : (
        <ul className="todoist__list">
          {shown.map((task) => (
            <li key={task.id} className="todoist__task">
              <button
                type="button"
                className={`todoist__check todoist__check--p${task.priority}`}
                aria-label={`Complete "${task.content}"`}
                onClick={() => void complete(task)}
              >
                <Circle size={16} />
              </button>
              <a
                className="todoist__content"
                href={taskUrl(task.id)}
                target="_blank"
                rel="noreferrer"
              >
                {task.content}
                {task.due && (
                  <span className="todoist__due">{task.due.string}</span>
                )}
              </a>
            </li>
          ))}
        </ul>
      )}

      {/* Adding tasks is everyday use, so it stays on when the page is locked */}
      <form className="todoist__add" onSubmit={(event) => void submit(event)}>
        <input
          className="todoist__input"
          aria-label="Add a task"
          placeholder="Add a task…"
          maxLength={500}
          value={draft}
          disabled={adding}
          onChange={(event) => setDraft(event.target.value)}
        />
      </form>
    </>
  );
}
