import { useState, type FormEvent } from "react";

import SegmentedControl from "@/ui/SegmentedControl";

import {
  createTask,
  moveTask,
  updateTask,
  type DueChange,
  type TaskChanges,
  type TodoistProject,
  type TodoistTask,
} from "./api";
import DateButton from "./DateButton";
import DeleteButton from "./DeleteButton";

// The app's P1 is the API's 4
const PRIORITIES = [
  { value: "4", label: "P1" },
  { value: "3", label: "P2" },
  { value: "2", label: "P3" },
  { value: "1", label: "P4" },
] as const;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function dueChange(due: string): DueChange {
  return !due
    ? { kind: "none" }
    : ISO_DATE.test(due)
      ? { kind: "date", date: due }
      : { kind: "text", text: due };
}

interface Fields {
  content: string;
  description: string;
  due: string;
  priority: number;
  labels: string[];
}

const sameLabels = (a: string[], b: string[]) =>
  a.length === b.length && a.every((label) => b.includes(label));

export function changesFor(task: TodoistTask, fields: Fields): TaskChanges {
  const changes: TaskChanges = {};
  if (fields.content !== task.content) changes.content = fields.content;
  if (fields.description !== (task.description ?? ""))
    changes.description = fields.description;
  if (!sameLabels(fields.labels, task.labels ?? []))
    changes.labels = fields.labels;
  if (fields.priority !== task.priority) changes.priority = fields.priority;
  if (fields.due !== (task.due?.string ?? ""))
    changes.due = dueChange(fields.due);
  return changes;
}

export type TaskFormResult =
  | { kind: "created"; task: TodoistTask }
  | { kind: "saved"; task: TodoistTask; moved: boolean };

/** Full task form: creates a task, or edits one when `task` is given. */
export default function TaskForm({
  token,
  task,
  projects,
  labels: allLabels,
  defaultDue = "",
  onDone,
  onCancel,
  onDelete,
  onError,
}: {
  token: string;
  task?: TodoistTask;
  projects: TodoistProject[];
  labels: string[];
  /** Prefilled due date when creating. */
  defaultDue?: string;
  onDone: (result: TaskFormResult) => void;
  onCancel: () => void;
  /** Editing only. */
  onDelete?: () => void;
  onError: (error: unknown) => void;
}) {
  const inbox = projects.find((project) => project.isInbox)?.id ?? "";
  const [content, setContent] = useState(task?.content ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [due, setDue] = useState(task ? (task.due?.string ?? "") : defaultDue);
  const [priority, setPriority] = useState(task?.priority ?? 1);
  const [projectId, setProjectId] = useState(
    task ? (task.projectId ?? "") : inbox,
  );
  const [labels, setLabels] = useState<string[]>(task?.labels ?? []);
  const [saving, setSaving] = useState(false);

  // Labels on the task that the cached list does not know yet still show
  const labelChoices = [
    ...allLabels,
    ...labels.filter((label) => !allLabels.includes(label)),
  ];
  const name = task ? `Edit "${task.content}"` : "New task";

  const toggleLabel = (label: string) =>
    setLabels((current) =>
      current.includes(label)
        ? current.filter((l) => l !== label)
        : [...current, label],
    );

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!content.trim() || saving) return;
    const fields: Fields = {
      content: content.trim(),
      description: description.trim(),
      due: due.trim(),
      priority,
      labels,
    };

    setSaving(true);
    try {
      if (!task) {
        const created = await createTask(token, {
          ...fields,
          due: dueChange(fields.due),
          projectId: projectId || null,
        });
        onDone({ kind: "created", task: created });
        return;
      }
      const changes = changesFor(task, fields);
      const moved = Boolean(projectId) && projectId !== task.projectId;
      if (Object.keys(changes).length === 0 && !moved) return onCancel();
      let saved = task;
      if (Object.keys(changes).length > 0)
        saved = await updateTask(token, task.id, changes);
      if (moved) saved = await moveTask(token, task.id, projectId);
      onDone({ kind: "saved", task: saved, moved });
    } catch (error) {
      onError(error);
      setSaving(false);
    }
  };

  return (
    <form
      className="todoist-editor"
      aria-label={name}
      onSubmit={(event) => void save(event)}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onCancel();
        }
      }}
    >
      <input
        className="todoist__input"
        aria-label="Task name"
        placeholder="Task name"
        maxLength={500}
        value={content}
        disabled={saving}
        autoFocus
        onChange={(event) => setContent(event.target.value)}
      />
      <textarea
        className="todoist__input todoist__textarea"
        aria-label="Description"
        placeholder="Description"
        rows={2}
        maxLength={16_000}
        value={description}
        disabled={saving}
        onChange={(event) => setDescription(event.target.value)}
      />
      <div className="todoist__add-row">
        <input
          className="todoist__input"
          aria-label="Due date"
          placeholder="No date (try “next mon 9am”)"
          value={due}
          disabled={saving}
          onChange={(event) => setDue(event.target.value)}
        />
        <DateButton
          label="Pick a due date"
          value={
            ISO_DATE.test(due) ? due : (task?.due?.date.slice(0, 10) ?? "")
          }
          onChange={setDue}
        />
      </div>
      {projects.length > 0 && (
        <select
          className="todoist__input"
          aria-label="Project"
          value={projectId}
          disabled={saving}
          onChange={(event) => setProjectId(event.target.value)}
        >
          {/* Tasks cached before projects were tracked have none set */}
          {!projectId && <option value="">Choose a project</option>}
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      )}
      {labelChoices.length > 0 && (
        <div className="todoist__labels" role="group" aria-label="Labels">
          {labelChoices.map((label) => (
            <button
              key={label}
              type="button"
              className="todoist__label-toggle"
              aria-pressed={labels.includes(label)}
              disabled={saving}
              onClick={() => toggleLabel(label)}
            >
              @{label}
            </button>
          ))}
        </div>
      )}
      <SegmentedControl
        label="Priority"
        value={String(priority) as (typeof PRIORITIES)[number]["value"]}
        options={PRIORITIES}
        onChange={(value) => setPriority(Number(value))}
      />
      <div className="todoist-editor__footer">
        {onDelete ? <DeleteButton onDelete={onDelete} /> : <span />}
        <span className="todoist-editor__actions">
          <button
            type="button"
            className="todoist__text-button"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="todoist__text-button todoist__text-button--primary"
            disabled={saving || !content.trim()}
          >
            {saving ? "Saving…" : task ? "Save" : "Add task"}
          </button>
        </span>
      </div>
    </form>
  );
}
