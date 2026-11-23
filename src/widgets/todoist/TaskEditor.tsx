import { useState, type FormEvent } from "react";

import SegmentedControl from "@/ui/SegmentedControl";

import {
  moveTask,
  updateTask,
  type TaskChanges,
  type TodoistProject,
  type TodoistTask,
} from "./api";
import DateButton from "./DateButton";

// The app's P1 is the API's 4
const PRIORITIES = [
  { value: "4", label: "P1" },
  { value: "3", label: "P2" },
  { value: "2", label: "P3" },
  { value: "1", label: "P4" },
] as const;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function changesFor(
  task: TodoistTask,
  content: string,
  due: string,
  priority: number,
): TaskChanges {
  const changes: TaskChanges = {};
  if (content !== task.content) changes.content = content;
  if (priority !== task.priority) changes.priority = priority;
  if (due !== (task.due?.string ?? ""))
    changes.due = !due
      ? { kind: "none" }
      : ISO_DATE.test(due)
        ? { kind: "date", date: due }
        : { kind: "text", text: due };
  return changes;
}

export default function TaskEditor({
  token,
  task,
  projects,
  onSaved,
  onCancel,
  onError,
}: {
  token: string;
  task: TodoistTask;
  projects: TodoistProject[];
  /** `moved` is true when the task changed project. */
  onSaved: (task: TodoistTask, moved: boolean) => void;
  onCancel: () => void;
  onError: (error: unknown) => void;
}) {
  const [content, setContent] = useState(task.content);
  const [due, setDue] = useState(task.due?.string ?? "");
  const [priority, setPriority] = useState(task.priority);
  const [projectId, setProjectId] = useState(task.projectId ?? "");
  const [saving, setSaving] = useState(false);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const changes = changesFor(task, content.trim(), due.trim(), priority);
    const moved = Boolean(projectId) && projectId !== task.projectId;
    if (!content.trim() || saving) return;
    if (Object.keys(changes).length === 0 && !moved) return onCancel();
    setSaving(true);
    try {
      let saved = task;
      if (Object.keys(changes).length > 0)
        saved = await updateTask(token, task.id, changes);
      if (moved) saved = await moveTask(token, task.id, projectId);
      onSaved(saved, moved);
    } catch (error) {
      onError(error);
      setSaving(false);
    }
  };

  return (
    <form
      className="todoist-editor"
      aria-label={`Edit "${task.content}"`}
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
        maxLength={500}
        value={content}
        disabled={saving}
        autoFocus
        onChange={(event) => setContent(event.target.value)}
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
          value={ISO_DATE.test(due) ? due : (task.due?.date.slice(0, 10) ?? "")}
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
      <div className="todoist-editor__footer">
        <SegmentedControl
          label="Priority"
          value={String(priority) as (typeof PRIORITIES)[number]["value"]}
          options={PRIORITIES}
          onChange={(value) => setPriority(Number(value))}
        />
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
            {saving ? "Saving…" : "Save"}
          </button>
        </span>
      </div>
    </form>
  );
}
