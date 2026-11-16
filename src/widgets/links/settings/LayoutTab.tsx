import { CheckboxField, RangeField, SelectField } from "@/ui/fields";

import type { LinksData, LinksLayout, TabSwitch } from "../model";

interface Props {
  data: LinksData;
  setData: (data: LinksData) => void;
}

export default function LayoutTab({ data, setData }: Props) {
  const set = (patch: Partial<LinksData>) => setData({ ...data, ...patch });
  return (
    <>
      <SelectField<LinksLayout>
        label="Layout"
        value={data.layout}
        options={[
          { value: "grid", label: "Grid (folders open as popovers)" },
          { value: "tabs", label: "Tabs (folders become tabs)" },
        ]}
        onChange={(layout) => set({ layout })}
      />
      {data.layout === "tabs" && (
        <>
          <SelectField<TabSwitch>
            label="Switch tabs"
            value={data.tabSwitch}
            options={[
              { value: "click", label: "On click" },
              { value: "hover", label: "On hover" },
            ]}
            onChange={(tabSwitch) => set({ tabSwitch })}
          />
          <p className="hint">
            Links that aren&apos;t in a folder appear in a &ldquo;Links&rdquo;
            tab.
          </p>
        </>
      )}
      <RangeField
        label="Columns"
        min={1}
        max={12}
        value={data.columns}
        onChange={(columns) => set({ columns })}
      />

      <h4 className="settings-subheading">Behaviour</h4>
      <CheckboxField
        label="Show a + tile for adding links on the page"
        checked={data.showAddTile}
        onChange={(showAddTile) => set({ showAddTile })}
      />
      <CheckboxField
        label="Open links in a new tab"
        checked={data.openInNewTab}
        onChange={(openInNewTab) => set({ openInNewTab })}
      />
      <CheckboxField
        label="Number keys 1–9 open links and folders"
        checked={data.shortcuts}
        onChange={(shortcuts) => set({ shortcuts })}
      />
      <CheckboxField
        label="Load website icons"
        checked={data.favicons}
        onChange={(favicons) => set({ favicons })}
      />
      <p className="hint">
        Website icons come from DuckDuckGo, which sees each link&apos;s domain.
        Off by default; letters are shown instead.
      </p>
    </>
  );
}
