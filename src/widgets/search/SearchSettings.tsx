import type { WidgetSettingsProps } from "@/core/widgets/types";
import { CheckboxField, SelectField, TextField } from "@/ui/fields";

import type { SearchData } from ".";
import { customUrlError, ENGINES, type EngineId } from "./engines";

const engineOptions: { value: EngineId; label: string }[] = [
  ...Object.entries(ENGINES).map(([value, engine]) => ({
    value: value as EngineId,
    label: engine.name,
  })),
  { value: "custom", label: "Custom…" },
];

export default function SearchSettings({
  data,
  setData,
}: WidgetSettingsProps<SearchData>) {
  const error = data.customUrl ? customUrlError(data.customUrl) : null;

  return (
    <>
      <SelectField
        label="Search engine"
        value={data.engine}
        options={engineOptions}
        onChange={(engine) => setData({ ...data, engine })}
      />
      {data.engine === "custom" && (
        <TextField
          label="Search address"
          type="url"
          value={data.customUrl}
          placeholder="https://example.com/search?q={query}"
          invalid={error !== null}
          hint={error ?? "Use {query} where the search words go."}
          onChange={(customUrl) => setData({ ...data, customUrl })}
        />
      )}
      <CheckboxField
        label="Open results in a new tab"
        checked={data.openInNewTab}
        onChange={(openInNewTab) => setData({ ...data, openInNewTab })}
      />
    </>
  );
}
