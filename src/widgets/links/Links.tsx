import type { WidgetProps } from "@/core/widgets/types";

import LinkTile from "./LinkTile";
import type { Link, LinksData } from "./model";
import { resolveStyle, styleClasses, styleVars } from "./style";
import { normalizeUrl } from "./url";
import { useNumberShortcuts } from "./useNumberShortcuts";
import "./Links.css";

export function openLink(link: Link, newTab: boolean) {
  const url = normalizeUrl(link.url);
  if (!url) return;
  if (newTab) window.open(url, "_blank", "noopener");
  else window.location.assign(url);
}

export default function Links({ data }: WidgetProps<LinksData>) {
  const style = resolveStyle(data.style);

  useNumberShortcuts(data.shortcuts, (index) => {
    const item = data.items[index];
    if (item?.kind === "link") openLink(item, data.openInNewTab);
  });

  if (data.items.length === 0)
    return <p className="links__empty">Add links in settings.</p>;

  return (
    <nav
      className={styleClasses(style)}
      style={styleVars(style, data.columns)}
      aria-label="Quick links"
    >
      {data.items.map((item, index) =>
        item.kind === "link" ? (
          <LinkTile
            key={item.id}
            link={item}
            number={data.shortcuts && index < 9 ? index + 1 : undefined}
            openInNewTab={data.openInNewTab}
            favicons={data.favicons}
          />
        ) : null,
      )}
    </nav>
  );
}
