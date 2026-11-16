import { Plus } from "lucide-react";
import { useState } from "react";

import type { WidgetSettingsProps } from "@/core/widgets/types";
import { CheckboxField, RangeField } from "@/ui/fields";

import { addItem, moveItem, removeItem, updateItem } from "./items";
import LinkEditor from "./LinkEditor";
import { newLink, type Item, type Link, type LinksData } from "./model";
import StyleEditor from "./StyleEditor";
import { resolveStyle } from "./style";
import "./LinksSettings.css";

export default function LinksSettings({
  data,
  setData,
}: WidgetSettingsProps<LinksData>) {
  const [openId, setOpenId] = useState<string | null>(null);
  const setItems = (items: Item[]) => setData({ ...data, items });

  const add = () => {
    const link = newLink();
    setItems(addItem(data.items, link));
    setOpenId(link.id);
  };

  const remove = (item: Item, label: string) => {
    if (confirm(`Remove ${label}?`)) setItems(removeItem(data.items, item.id));
  };

  return (
    <div className="links-settings">
      <h4 className="settings-subheading">Links</h4>
      <ul className="item-list">
        {data.items.map((item, index) =>
          item.kind === "link" ? (
            <LinkEditor
              key={item.id}
              link={item}
              open={openId === item.id}
              isFirst={index === 0}
              isLast={index === data.items.length - 1}
              onToggle={() => setOpenId(openId === item.id ? null : item.id)}
              onChange={(patch) =>
                setItems(updateItem<Link>(data.items, item.id, patch))
              }
              onMove={(direction) =>
                setItems(moveItem(data.items, item.id, direction))
              }
              onRemove={() =>
                remove(item, item.name || item.url || "this link")
              }
            />
          ) : null,
        )}
      </ul>
      <div className="preset-buttons">
        <button type="button" className="button" onClick={add}>
          <Plus size={16} aria-hidden /> Add link
        </button>
      </div>

      <h4 className="settings-subheading">Options</h4>
      <RangeField
        label="Columns"
        min={1}
        max={12}
        value={data.columns}
        onChange={(columns) => setData({ ...data, columns })}
      />
      <CheckboxField
        label="Open links in a new tab"
        checked={data.openInNewTab}
        onChange={(openInNewTab) => setData({ ...data, openInNewTab })}
      />
      <CheckboxField
        label="Number keys 1–9 open links"
        checked={data.shortcuts}
        onChange={(shortcuts) => setData({ ...data, shortcuts })}
      />
      <CheckboxField
        label="Load website icons"
        checked={data.favicons}
        onChange={(favicons) => setData({ ...data, favicons })}
      />
      <p className="hint">
        Website icons are loaded from DuckDuckGo, which sees each link&apos;s
        domain. Off by default; letters are shown instead.
      </p>

      <h4 className="settings-subheading">Style</h4>
      <StyleEditor
        style={resolveStyle(data.style)}
        onChange={(style) => setData({ ...data, style })}
      />
    </div>
  );
}
