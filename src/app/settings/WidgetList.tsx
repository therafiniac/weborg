import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useId, useState } from "react";

import {
  POSITIONS,
  POSITION_LABELS,
  type Position,
} from "@/core/layout/positions";
import type { Settings, WidgetInstance } from "@/core/storage/settings";
import {
  addWidget,
  moveWidget,
  removeWidget,
  sortWidgets,
  updateWidget,
} from "@/core/widgets/actions";
import { removeWidgetData, useWidgetData } from "@/core/widgets/data";
import type { WidgetDefinition } from "@/core/widgets/types";
import { getWidget, widgets } from "@/widgets";

import WidgetStyleSettings from "./WidgetStyleSettings";

import "./WidgetList.css";

interface Props {
  settings: Settings;
  onChange: (settings: Settings) => void;
}

export default function WidgetList({ settings, onChange }: Props) {
  const addId = useId();
  const [newType, setNewType] = useState(widgets[0]?.type ?? "");
  const sorted = sortWidgets(settings.widgets);

  const handleRemove = (instance: WidgetInstance, name: string) => {
    if (!confirm(`Remove the ${name} widget? Its content will be deleted.`))
      return;
    onChange(removeWidget(settings, instance.id));
    removeWidgetData(instance.id).catch((error: unknown) =>
      console.error("Weborg: failed to delete widget data", error),
    );
  };

  return (
    <>
      {sorted.length === 0 && (
        <p className="hint">No widgets yet. Add one below.</p>
      )}

      <ul className="widget-list">
        {sorted.map((instance, index) => {
          const definition = getWidget(instance.type);
          return (
            <li key={instance.id} className="widget-list__item">
              {definition ? (
                <WidgetItem
                  instance={instance}
                  definition={definition}
                  isFirst={index === 0}
                  isLast={index === sorted.length - 1}
                  onMove={(direction) =>
                    onChange(moveWidget(settings, instance.id, direction))
                  }
                  onPosition={(position) =>
                    onChange(updateWidget(settings, instance.id, { position }))
                  }
                  pageColour={settings.appearance.textColour}
                  onDisplay={(display) =>
                    onChange(updateWidget(settings, instance.id, { display }))
                  }
                  onRemove={() => handleRemove(instance, definition.name)}
                />
              ) : (
                <div className="widget-item__header">
                  <span>Unknown widget ({instance.type})</span>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => handleRemove(instance, instance.type)}
                    aria-label={`Remove unknown widget ${instance.type}`}
                  >
                    <Trash2 size={16} aria-hidden />
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="widget-list__add">
        <label htmlFor={addId} className="visually-hidden">
          Widget to add
        </label>
        <select
          id={addId}
          value={newType}
          onChange={(event) => setNewType(event.target.value)}
        >
          {widgets.map((widget) => (
            <option key={widget.type} value={widget.type}>
              {widget.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="button button--primary"
          onClick={() => onChange(addWidget(settings, newType).settings)}
        >
          <Plus size={16} aria-hidden /> Add widget
        </button>
      </div>
    </>
  );
}

interface ItemProps {
  instance: WidgetInstance;
  definition: WidgetDefinition;
  isFirst: boolean;
  isLast: boolean;
  onMove: (direction: -1 | 1) => void;
  onPosition: (position: Position) => void;
  pageColour: string;
  onDisplay: (display: WidgetInstance["display"]) => void;
  onRemove: () => void;
}

function WidgetItem({
  instance,
  definition,
  isFirst,
  isLast,
  onMove,
  onPosition,
  pageColour,
  onDisplay,
  onRemove,
}: ItemProps) {
  const positionId = useId();
  const [open, setOpen] = useState(false);
  const bodyId = useId();

  return (
    <>
      <div className="widget-item__header">
        <button
          type="button"
          className="widget-item__toggle"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => setOpen(!open)}
        >
          {definition.name}
        </button>
        <button
          type="button"
          className="icon-button"
          disabled={isFirst}
          onClick={() => onMove(-1)}
          aria-label={`Move ${definition.name} up`}
        >
          <ChevronUp size={16} aria-hidden />
        </button>
        <button
          type="button"
          className="icon-button"
          disabled={isLast}
          onClick={() => onMove(1)}
          aria-label={`Move ${definition.name} down`}
        >
          <ChevronDown size={16} aria-hidden />
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={onRemove}
          aria-label={`Remove ${definition.name}`}
        >
          <Trash2 size={16} aria-hidden />
        </button>
      </div>

      {open && (
        <div id={bodyId} className="widget-item__body">
          <div className="field">
            <label htmlFor={positionId}>Position</label>
            <select
              id={positionId}
              value={instance.position}
              onChange={(event) => onPosition(event.target.value as Position)}
            >
              {POSITIONS.map((position) => (
                <option key={position} value={position}>
                  {POSITION_LABELS[position]}
                </option>
              ))}
            </select>
          </div>
          {definition.Settings && (
            <WidgetSettings instance={instance} definition={definition} />
          )}
          <WidgetStyleSettings
            display={instance.display}
            pageColour={pageColour}
            onChange={onDisplay}
          />
        </div>
      )}
    </>
  );
}

function WidgetSettings({
  instance,
  definition,
}: {
  instance: WidgetInstance;
  definition: WidgetDefinition;
}) {
  const [data, setData] = useWidgetData(instance.id, definition);
  const Settings = definition.Settings;
  if (!Settings || data === undefined) return null;
  return <Settings instance={instance} data={data} setData={setData} />;
}
