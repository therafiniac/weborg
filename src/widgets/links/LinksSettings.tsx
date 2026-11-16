import { FolderPlus, Plus } from "lucide-react";
import { useState } from "react";

import type { WidgetSettingsProps } from "@/core/widgets/types";
import { CheckboxField, RangeField, SelectField } from "@/ui/fields";

import FolderEditor from "./FolderEditor";
import { addItem, moveItem, moveLinkTo, removeItem, updateItem } from "./items";
import LinkEditor from "./LinkEditor";
import {
  newFolder,
  newLink,
  type Folder,
  type Item,
  type Link,
  type LinksData,
} from "./model";
import StyleEditor from "./StyleEditor";
import { resolveStyle } from "./style";
import "./LinksSettings.css";

export default function LinksSettings({
  data,
  setData,
}: WidgetSettingsProps<LinksData>) {
  const [openId, setOpenId] = useState<string | null>(null);
  const setItems = (items: Item[]) => setData({ ...data, items });
  const toggle = (id: string) => setOpenId(openId === id ? null : id);

  const folders = data.items.filter(
    (item): item is Folder => item.kind === "folder",
  );
  const folderOptions = [
    { value: "", label: "None (top level)" },
    ...folders.map((folder) => ({
      value: folder.id,
      label: folder.name || "Folder",
    })),
  ];

  const addLink = (folderId: string | null = null) => {
    const link = newLink();
    setItems(addItem(data.items, link, folderId));
    setOpenId(link.id);
  };

  const addFolder = () => {
    const folder = newFolder();
    setItems(addItem(data.items, folder));
    setOpenId(folder.id);
  };

  const remove = (item: Item) => {
    const message =
      item.kind === "folder"
        ? item.links.length > 0
          ? `Delete the folder "${item.name}" and its ${item.links.length} links?`
          : null
        : `Remove ${item.name || item.url || "this link"}?`;
    if (message === null || confirm(message))
      setItems(removeItem(data.items, item.id));
  };

  const linkEditor = (
    link: Link,
    list: readonly Link[] | readonly Item[],
    index: number,
    folderId: string | null,
  ) => (
    <LinkEditor
      key={link.id}
      link={link}
      open={openId === link.id}
      isFirst={index === 0}
      isLast={index === list.length - 1}
      onToggle={() => toggle(link.id)}
      onChange={(patch) =>
        setItems(updateItem<Link>(data.items, link.id, patch))
      }
      onMove={(direction) => setItems(moveItem(data.items, link.id, direction))}
      onRemove={() => remove(link)}
    >
      {folders.length > 0 && (
        <SelectField
          label="Folder"
          value={folderId ?? ""}
          options={folderOptions}
          onChange={(target) =>
            setItems(moveLinkTo(data.items, link.id, target || null))
          }
        />
      )}
    </LinkEditor>
  );

  return (
    <div className="links-settings">
      <h4 className="settings-subheading">Links</h4>
      <ul className="item-list">
        {data.items.map((item, index) =>
          item.kind === "link" ? (
            linkEditor(item, data.items, index, null)
          ) : (
            <FolderEditor
              key={item.id}
              folder={item}
              open={openId === item.id}
              isFirst={index === 0}
              isLast={index === data.items.length - 1}
              onToggle={() => toggle(item.id)}
              onChange={(patch) =>
                setItems(updateItem<Folder>(data.items, item.id, patch))
              }
              onMove={(direction) =>
                setItems(moveItem(data.items, item.id, direction))
              }
              onRemove={() => remove(item)}
              onAddLink={() => addLink(item.id)}
            >
              {item.links.map((link, linkIndex) =>
                linkEditor(link, item.links, linkIndex, item.id),
              )}
            </FolderEditor>
          ),
        )}
      </ul>
      <div className="preset-buttons">
        <button type="button" className="button" onClick={() => addLink()}>
          <Plus size={16} aria-hidden /> Add link
        </button>
        <button type="button" className="button" onClick={addFolder}>
          <FolderPlus size={16} aria-hidden /> Add folder
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
        label="Number keys 1–9 open links and folders"
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
