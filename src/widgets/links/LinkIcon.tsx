import { useState } from "react";

import { isIconName, NamedIcon } from "./icons";
import type { Link } from "./model";
import { hostname, linkLabel } from "./url";

interface Props {
  link: Link;
  url: string | null;
  favicons: boolean;
}

export default function LinkIcon({ link, url, favicons }: Props) {
  const [failed, setFailed] = useState(false);

  if (link.icon === "none") return null;
  if (isIconName(link.icon))
    return (
      <span className="links__icon">
        <NamedIcon name={link.icon} />
      </span>
    );

  if (favicons && url && !failed)
    return (
      <img
        className="links__icon links__favicon"
        src={`https://icons.duckduckgo.com/ip3/${hostname(url)}.ico`}
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );

  return (
    <span className="links__icon links__letter" aria-hidden>
      {linkLabel(link).charAt(0).toUpperCase()}
    </span>
  );
}
