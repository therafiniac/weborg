import type { CSSProperties } from "react";

import type { WidgetInstance } from "@/core/storage/settings";
import { useWidgetData } from "@/core/widgets/data";
import type { WidgetDefinition } from "@/core/widgets/types";
import ErrorBoundary from "@/ui/ErrorBoundary";

interface Props {
  instance: WidgetInstance;
  definition: WidgetDefinition;
}

/** Loads a widget's data and isolates it behind an error boundary. */
export default function WidgetHost({ instance, definition }: Props) {
  const [data, setData] = useWidgetData(instance.id, definition);
  const { Component } = definition;

  return (
    <div
      className="widget"
      data-widget-type={instance.type}
      style={displayVars(instance.display)}
    >
      <ErrorBoundary
        fallback={() => (
          <p className="widget__error" role="alert">
            {definition.name} stopped working. Try reloading the page.
          </p>
        )}
      >
        {data !== undefined && (
          <Component instance={instance} data={data} setData={setData} />
        )}
      </ErrorBoundary>
    </div>
  );
}

function displayVars(display: WidgetInstance["display"]): CSSProperties {
  const vars: Record<string, string> = {};
  if (display.fontFamily) vars["--widget-font"] = display.fontFamily;
  if (display.fontSize) vars["--widget-size"] = `${display.fontSize}px`;
  if (display.fontWeight) vars["--widget-weight"] = String(display.fontWeight);
  if (display.colour) vars["--widget-colour"] = display.colour;
  return vars as CSSProperties;
}
