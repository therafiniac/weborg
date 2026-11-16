import { Plus } from "lucide-react";
import { useState } from "react";

import type { Settings, WidgetInstance } from "@/core/storage/settings";
import { addWidget, sortWidgets } from "@/core/widgets/actions";
import { useWidgetData } from "@/core/widgets/data";
import type { WidgetDefinition } from "@/core/widgets/types";
import { SelectField } from "@/ui/fields";

interface Props {
  definition: WidgetDefinition;
  settings: Settings;
  onChange: (settings: Settings) => void;
}

/** A widget's settings shown as its own settings tab. */
export default function WidgetSection({
  definition,
  settings,
  onChange,
}: Props) {
  const instances = sortWidgets(settings.widgets).filter(
    (widget) => widget.type === definition.type,
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const instance =
    instances.find((widget) => widget.id === selectedId) ?? instances[0];

  if (!instance)
    return (
      <>
        <p className="hint">
          There is no {definition.name} widget on your page.
        </p>
        <button
          type="button"
          className="button button--primary"
          onClick={() =>
            onChange(addWidget(settings, definition.type).settings)
          }
        >
          <Plus size={16} aria-hidden /> Add {definition.name}
        </button>
      </>
    );

  return (
    <>
      {instances.length > 1 && (
        <SelectField
          label={`Which ${definition.name} widget`}
          value={instance.id}
          options={instances.map((widget, index) => ({
            value: widget.id,
            label: `${definition.name} ${index + 1}`,
          }))}
          onChange={setSelectedId}
        />
      )}
      <InstanceSettings
        key={instance.id}
        definition={definition}
        instance={instance}
      />
    </>
  );
}

function InstanceSettings({
  definition,
  instance,
}: {
  definition: WidgetDefinition;
  instance: WidgetInstance;
}) {
  const [data, setData] = useWidgetData(instance.id, definition);
  const SettingsComponent = definition.Settings;
  if (!SettingsComponent || data === undefined) return null;
  return (
    <SettingsComponent instance={instance} data={data} setData={setData} />
  );
}
