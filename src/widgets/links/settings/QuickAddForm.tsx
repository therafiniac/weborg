import { Plus } from "lucide-react";
import { useId, useState, type RefObject } from "react";

import { newLink, type Link } from "../model";
import { linkLabel, normalizeUrl } from "../url";

interface Props {
  /** Folder choices; omit to hide the folder picker. */
  folders?: readonly { id: string; name: string }[];
  folderId: string | null;
  onFolderChange?: (folderId: string | null) => void;
  onAdd: (link: Link, folderId: string | null) => void;
  urlRef?: RefObject<HTMLInputElement | null>;
  autoFocus?: boolean;
  title?: string;
}

/**
 * Paste a URL, press Enter, done. Fields clear for the next link and focus
 * stays in the address box, so several links can be added in a row.
 */
export default function QuickAddForm({
  folders,
  folderId,
  onFolderChange,
  onAdd,
  urlRef,
  autoFocus,
  title = "Add a link",
}: Props) {
  const id = useId();
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  return (
    <form
      className="quick-add"
      aria-labelledby={`${id}-title`}
      onSubmit={(event) => {
        event.preventDefault();
        const normalized = normalizeUrl(url);
        if (!normalized) {
          setError(
            url.trim()
              ? "That doesn't look like a web address. Try example.com"
              : "Enter a web address first.",
          );
          return;
        }
        const link = newLink(normalized, name.trim());
        onAdd(link, folderId);
        setUrl("");
        setName("");
        setError(null);
        setStatus(`Added ${linkLabel(link)}`);
        urlRef?.current?.focus();
      }}
    >
      <h5 id={`${id}-title`} className="quick-add__title">
        {title}
      </h5>
      <div className="quick-add__row">
        <label className="visually-hidden" htmlFor={`${id}-url`}>
          Web address
        </label>
        <input
          ref={urlRef}
          id={`${id}-url`}
          type="text"
          inputMode="url"
          autoComplete="off"
          placeholder="Paste a link"
          value={url}
          autoFocus={autoFocus}
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-msg`}
          onChange={(event) => {
            setUrl(event.target.value);
            setError(null);
          }}
        />
        <label className="visually-hidden" htmlFor={`${id}-name`}>
          Name (optional)
        </label>
        <input
          id={`${id}-name`}
          type="text"
          placeholder="Name (optional)"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="quick-add__row">
        {folders && folders.length > 0 && onFolderChange && (
          <>
            <label className="visually-hidden" htmlFor={`${id}-folder`}>
              Folder
            </label>
            <select
              id={`${id}-folder`}
              value={folderId ?? ""}
              onChange={(event) => onFolderChange(event.target.value || null)}
            >
              <option value="">No folder</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name || "Folder"}
                </option>
              ))}
            </select>
          </>
        )}
        <button type="submit" className="button button--primary">
          <Plus size={16} aria-hidden /> Add
        </button>
      </div>
      <p
        id={`${id}-msg`}
        className={error ? "field__error" : "hint"}
        role={error ? "alert" : "status"}
      >
        {error ?? status}
      </p>
    </form>
  );
}
