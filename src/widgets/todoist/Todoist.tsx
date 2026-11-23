import { Eye, EyeOff, RefreshCw } from "lucide-react";
import { useCallback, useState } from "react";

import { useStorageItem } from "@/core/storage/useStorageItem";
import { PasswordPrompt } from "@/ui/PasswordFields";
import type { WidgetProps } from "@/core/widgets/types";

import type { TodoistData } from ".";
import AddTask, { AddedMessage, whereAdded, type AddedNotice } from "./AddTask";
import { closeTask, deleteTask, type TodoistTask } from "./api";
import { useShowPassword } from "./privacy";
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
  setData,
}: WidgetProps<TodoistData> & { token: string }) {
  // With hideOnOpen, each new tab starts hidden and showing is not saved
  const [tabHidden, setTabHidden] = useState(true);
  const hidden = data.hideOnOpen ? tabHidden : data.hidden;
  const showPassword = useShowPassword(data.showPassword);
  const [askingPassword, setAskingPassword] = useState(false);

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

  const reveal = () => {
    setAskingPassword(false);
    if (data.hideOnOpen) setTabHidden(false);
    else setData({ ...data, hidden: false });
  };

  const toggleHidden = () => {
    if (hidden) {
      // Hiding is always free; showing may need a password
      if (showPassword === undefined) return; // still loading
      if (showPassword) setAskingPassword((open) => !open);
      else reveal();
      return;
    }
    // Nothing private stays open behind the curtain
    setMode({ kind: "list" });
    setExpanded(null);
    setNotice(null);
    if (data.hideOnOpen) setTabHidden(true);
    else setData({ ...data, hidden: true });
  };

  const shown = tasks?.slice(0, data.maxTasks) ?? [];
  const projectOf = (task: TodoistTask) =>
    projects.find((project) => project.id === task.projectId);

  return (
    <>
      <header className="todoist__header">
        <h2 className="todoist__title">{data.title || "Tasks"}</h2>
        <span className="todoist__header-actions">
          <button
            type="button"
            className="todoist__icon-button"
            aria-label={hidden ? "Show tasks" : "Hide tasks"}
            title={hidden ? "Show tasks" : "Hide tasks"}
            onClick={toggleHidden}
          >
            {hidden ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
          <button
            type="button"
            className="todoist__icon-button"
            aria-label="Refresh tasks"
            disabled={loading}
            onClick={() => void reload()}
          >
            <RefreshCw size={14} className={loading ? "todoist__spin" : ""} />
          </button>
        </span>
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

      {hidden ? (
        askingPassword && showPassword ? (
          <PasswordPrompt
            record={showPassword}
            label={
              data.showPassword === "weborg"
                ? "Weborg password"
                : "Todoist password"
            }
            submitLabel="Show tasks"
            variant="glass"
            onSuccess={reveal}
            onCancel={() => setAskingPassword(false)}
          />
        ) : (
          <HiddenTasks count={tasks?.length ?? null} />
        )
      ) : tasks === null ? (
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
      {hidden ? null : mode.kind === "create" ? (
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
      {notice && !hidden && mode.kind === "list" && (
        <AddedMessage notice={notice} />
      )}
    </>
  );
}

/** Placeholder bars only: no task text is on the page while hidden. */
function HiddenTasks({ count }: { count: number | null }) {
  const bars = Math.min(count ?? 3, 3);
  return (
    <div className="todoist__hidden">
      <p className="todoist__message">
        {count === null
          ? "Tasks hidden."
          : `${count} ${count === 1 ? "task" : "tasks"} hidden.`}
      </p>
      {Array.from({ length: bars }, (_, index) => (
        <span key={index} className="todoist__hidden-bar" aria-hidden="true" />
      ))}
    </div>
  );
}
