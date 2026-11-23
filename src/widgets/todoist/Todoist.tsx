import { Circle, Pencil, RefreshCw } from "lucide-react";
import { useState } from "react";

import { useStorageItem } from "@/core/storage/useStorageItem";
import type { WidgetProps } from "@/core/widgets/types";

import type { TodoistData } from ".";
import AddTask from "./AddTask";
import { closeTask, taskUrl, type TodoistTask } from "./api";
import { tokenItem } from "./storage";
import TaskEditor from "./TaskEditor";
import { useProjects } from "./useProjects";
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
  const {
    tasks,
    loading,
    error,
    reload,
    removeTask,
    restoreTask,
    replaceTask,
    setError,
  } = useTasks(token, data.filter);
  const projects = useProjects(token);
  const [editing, setEditing] = useState<string | null>(null);

  const complete = async (task: TodoistTask) => {
    removeTask(task.id);
    try {
      await closeTask(token, task.id);
    } catch (error) {
      restoreTask(task);
      setError(error);
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
          {shown.map((task) =>
            editing === task.id ? (
              <li key={task.id}>
                <TaskEditor
                  token={token}
                  task={task}
                  projects={projects}
                  onSaved={(saved, moved) => {
                    setEditing(null);
                    // A new project may take it out of this widget's filter
                    if (moved) void reload();
                    else replaceTask(saved);
                  }}
                  onCancel={() => setEditing(null)}
                  onError={setError}
                />
              </li>
            ) : (
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
                  {/* Space keeps the accessible name "Buy milk today" */}
                  {task.due && " "}
                  {task.due && (
                    <span className="todoist__due">{task.due.string}</span>
                  )}
                </a>
                <button
                  type="button"
                  className="todoist__icon-button todoist__edit"
                  aria-label={`Edit "${task.content}"`}
                  onClick={() => setEditing(task.id)}
                >
                  <Pencil size={14} />
                </button>
              </li>
            ),
          )}
        </ul>
      )}

      {/* Adding and editing are everyday use, so they stay on when locked */}
      <AddTask
        token={token}
        projects={projects}
        defaultDue={data.defaultDue}
        onError={setError}
        onAdded={async (task) => {
          const fresh = await reload();
          return Boolean(
            fresh?.slice(0, data.maxTasks).some((t) => t.id === task.id),
          );
        }}
      />
    </>
  );
}
