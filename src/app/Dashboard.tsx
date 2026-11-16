import { appearanceVars } from "@/core/appearance/appearance";
import { groupByPosition } from "@/core/layout/positions";
import type { Settings } from "@/core/storage/settings";
import { getWidget } from "@/widgets";

import WidgetHost from "./WidgetHost";
import "./Dashboard.css";

interface Props {
  settings: Settings;
}

export default function Dashboard({ settings }: Props) {
  const groups = groupByPosition(settings.widgets);

  return (
    <div className="dashboard" style={appearanceVars(settings.appearance)}>
      {[...groups].map(([position, instances]) => (
        <section
          key={position}
          className={`slot slot--${position}`}
          aria-label={`Widgets: ${position.replace("-", " ")}`}
        >
          {instances.map((instance) => {
            const definition = getWidget(instance.type);
            // Unknown types (e.g. from a newer version) are skipped, not fatal
            if (!definition) return null;
            return (
              <WidgetHost
                key={instance.id}
                instance={instance}
                definition={definition}
              />
            );
          })}
        </section>
      ))}
    </div>
  );
}
