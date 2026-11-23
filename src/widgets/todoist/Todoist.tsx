import { RefreshCw } from "lucide-react";
import { useCallback, useState } from "react";

import { useStorageItem } from "@/core/storage/useStorageItem";
import type { WidgetProps } from "@/core/widgets/types";

import type { TodoistData } from ".";
import AddTask, { AddedMessage, whereAdded, type AddedNotice } from "./AddTask";
import { closeTask, deleteTask, type TodoistTask } from "./api";
import { tokenItem } from "./storage";
import TaskForm from "./TaskForm";
import TaskRow from "./TaskRow";
import { useLabels, useProjects } from "./useProjects";
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

type Mode =
  { kind: "list" } | { kind: "edit"; id: string } | { kind: "create" };

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
  const labels = useLabels(token);
  const [mode, setMode] = useState<Mode>({ kind: "list" });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notice, setNotice] = useState<AddedNotice | null>(null);
  const clearNotice = useCallback(
    (next: AddedNotice | null) => setNotice(next),
    [],
  );

  /** Remove at once; put it back if Todoist refuses. */
  const removeWith = async (
    task: TodoistTask,
    action: (token: string, id: string) => Promise<void>,
  ) => {
    removeTask(task.id);
    if (expanded === task.id) setExpanded(null);
    if (mode.kind === "edit" && mode.id === task.id) setMode({ kind: "list" });
    try {
      await action(token, task.id);
    } catch (error) {
      restoreTask(task);
      setError(error);
    }
  };

  /** Reload; resolves whether the task is among the shown ones. */
  const showsAfterReload = async (task: TodoistTask) => {
    const fresh = await reload();
    return Boolean(
      fresh?.slice(0, data.maxTasks).some((t) => t.id === task.id),
    );
  };

  const shown = tasks?.slice(0, data.maxTasks) ?? [];
  const projectOf = (task: TodoistTask) =>
    projects.find((project) => project.id === task.projectId);

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
            mode.kind === "edit" && mode.id === task.id ? (
              <li key={task.id}>
                <TaskForm
                  token={token}
                  task={task}
                  projects={projects}
                  labels={labels}
                  onDone={(result) => {
                    setMode({ kind: "list" });
                    // A new project may take it out of this widget's filter
                    if (result.kind === "saved" && !result.moved)
                      replaceTask(result.task);
                    else void reload();
                  }}
                  onCancel={() => setMode({ kind: "list" })}
                  onDelete={() => void removeWith(task, deleteTask)}
                  onError={setError}
                />
              </li>
            ) : (
              <TaskRow
                key={task.id}
                task={task}
                project={projectOf(task)}
                expanded={expanded === task.id}
                onToggle={() =>
                  setExpanded((id) => (id === task.id ? null : task.id))
                }
                onComplete={() => void removeWith(task, closeTask)}
                onEdit={() => {
                  setExpanded(null);
                  setMode({ kind: "edit", id: task.id });
                }}
                onDelete={() => void removeWith(task, deleteTask)}
              />
            ),
          )}
        </ul>
      )}

      {/* Adding and editing are everyday use, so they stay on when locked.
          One form at a time: the add box hides while a form is open. */}
      {mode.kind === "create" ? (
        <TaskForm
          token={token}
          projects={projects}
          labels={labels}
          defaultDue={data.defaultDue}
          onDone={(result) => {
            setMode({ kind: "list" });
            void showsAfterReload(result.task).then((shows) => {
              if (!shows)
                setNotice({
                  task: result.task,
                  where: whereAdded(result.task, projects),
                });
            });
          }}
          onCancel={() => setMode({ kind: "list" })}
          onError={setError}
        />
      ) : (
        mode.kind === "list" && (
          <AddTask
            token={token}
            projects={projects}
            defaultDue={data.defaultDue}
            notice={notice}
            onNotice={clearNotice}
            onAdded={showsAfterReload}
            onOpenForm={() => {
              setExpanded(null);
              setNotice(null);
              setMode({ kind: "create" });
            }}
            onError={setError}
          />
        )
      )}
      {notice && mode.kind === "list" && <AddedMessage notice={notice} />}
    </>
  );
}
