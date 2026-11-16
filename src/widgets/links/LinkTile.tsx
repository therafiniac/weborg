import LinkIcon from "./LinkIcon";
import type { Link } from "./model";
import { linkLabel, normalizeUrl } from "./url";

interface Props {
  link: Link;
  number?: number;
  openInNewTab: boolean;
  favicons: boolean;
}

export default function LinkTile({
  link,
  number,
  openInNewTab,
  favicons,
}: Props) {
  const url = normalizeUrl(link.url);
  const label = linkLabel(link);

  if (!url)
    return (
      <span
        className="links__item links__item--invalid"
        title={`"${link.url}" is not a valid web address. Fix it in settings.`}
      >
        <span className="links__label">{label}</span>
      </span>
    );

  return (
    <a
      className="links__item"
      href={url}
      target={openInNewTab ? "_blank" : undefined}
      rel={openInNewTab ? "noopener noreferrer" : undefined}
      aria-label={label}
      title={number ? `${label} (press ${number})` : label}
    >
      <LinkIcon link={link} url={url} favicons={favicons} />
      <span className="links__label">{label}</span>
    </a>
  );
}
