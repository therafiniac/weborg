import { useState } from "react";

import type { WidgetSettingsProps } from "@/core/widgets/types";
import SubTabs from "@/ui/SubTabs";

import type { LinksData } from "./model";
import LayoutTab from "./settings/LayoutTab";
import LinksTab from "./settings/LinksTab";
import StyleEditor from "./StyleEditor";
import { resolveStyle } from "./style";
import "./LinksSettings.css";

export default function LinksSettings({
  data,
  setData,
}: WidgetSettingsProps<LinksData>) {
  const [tab, setTab] = useState("links");
  return (
    <div className="links-settings">
      <SubTabs
        label="Quick Links settings"
        activeId={tab}
        onSelect={setTab}
        tabs={[
          {
            id: "links",
            label: "Your links",
            content: (
              <LinksTab
                items={data.items}
                onChange={(items) => setData({ ...data, items })}
              />
            ),
          },
          {
            id: "layout",
            label: "Layout",
            content: <LayoutTab data={data} setData={setData} />,
          },
          {
            id: "style",
            label: "Style",
            content: (
              <StyleEditor
                style={resolveStyle(data.style)}
                onChange={(style) => setData({ ...data, style })}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
