import { Circle, ExternalLink, Flag, Hash, Pencil } from "lucide-react";

import { taskUrl, type TodoistProject, type TodoistTask } from "./api";
import DeleteButton from "./DeleteButton";

/** API priority 4 is the app's P1. */
const priorityName = (priority: number) => `P${5 - priority}`;

export default function TaskRow({
  task,
  project,
  expanded,
  onToggle,
  onComplete,
  onEdit,
  onDelete,
}: {
  task: TodoistTask;
  project: TodoistProject | undefined;
  expanded: boolean;
  onToggle: () => void;
  onComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const detailsId = `todoist-details-${task.id}`;
  const labels = task.labels ?? [];

  return (
    <li className={`todoist__task${expanded ? " is-expanded" : ""}`}>
      <div className="todoist__task-row">
        <button
          type="button"
          className={`todoist__check todoist__check--p${task.priority}`}
          aria-label={`Complete "${task.content}"`}
          onClick={onComplete}
        >
          <Circle size={16} />
        </button>
        <button
          type="button"
          className="todoist__content"
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={onToggle}
        >
          <span className="todoist__name">{task.content}</span>
          <span className="todoist__meta">
            {task.due && <span>{task.due.string}</span>}
            {task.priority > 1 && (
              <span
                className={`todoist__flag todoist__flag--p${task.priority}`}
              >
                <Flag size={11} aria-hidden="true" />
                {priorityName(task.priority)}
              </span>
            )}
            {project && (
              <span className="todoist__project">
                <Hash size={11} aria-hidden="true" />
                {project.name}
              </span>
            )}
          </span>
        </button>
        <span className="todoist__row-actions">
          <a
            className="todoist__icon-button"
            href={taskUrl(task.id)}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open "${task.content}" in Todoist`}
            title="Open in Todoist"
          >
            <ExternalLink size={14} />
          </a>
          <button
            type="button"
            className="todoist__icon-button"
            aria-label={`Edit "${task.content}"`}
            title="Edit"
            onClick={onEdit}
          >
            <Pencil size={14} />
          </button>
        </span>
      </div>

      {expanded && (
        <div
          id={detailsId}
          className="todoist-details"
          role="region"
          aria-label={`Details of "${task.content}"`}
        >
          <p className="todoist-details__title">{task.content}</p>
          {task.description && (
            <p className="todoist-details__description">{task.description}</p>
          )}
          <dl className="todoist-details__facts">
            <dt>Due</dt>
            <dd>{task.due?.string ?? "No date"}</dd>
            <dt>Priority</dt>
            <dd>{priorityName(task.priority)}</dd>
            {project && (
              <>
                <dt>Project</dt>
                <dd>{project.name}</dd>
              </>
            )}
            {labels.length > 0 && (
              <>
                <dt>Labels</dt>
                <dd>{labels.map((label) => `@${label}`).join(" ")}</dd>
              </>
            )}
          </dl>
          <div className="todoist-editor__footer">
            <DeleteButton onDelete={onDelete} />
            <span className="todoist-editor__actions">
              <a
                className="todoist__text-button"
                href={taskUrl(task.id)}
                target="_blank"
                rel="noreferrer"
              >
                Open in Todoist
              </a>
              <button
                type="button"
                className="todoist__text-button todoist__text-button--primary"
                onClick={onEdit}
              >
                Edit
              </button>
            </span>
          </div>
        </div>
      )}
    </li>
  );
}
