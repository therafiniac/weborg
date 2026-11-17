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

  const canAdd = url.trim() !== "";
  const message = error ?? status;

  return (
    <form
      className="quick-add"
      aria-labelledby={`${id}-title`}
      onSubmit={(event) => {
        event.preventDefault();
        if (!canAdd) return;
        const normalized = normalizeUrl(url);
        if (!normalized) {
          setError("That doesn't look like a web address. Try example.com");
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
          className="quick-add__url"
          type="text"
          inputMode="url"
          autoComplete="off"
          placeholder="Paste a link, then press Enter"
          value={url}
          autoFocus={autoFocus}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? `${id}-msg` : undefined}
          onChange={(event) => {
            setUrl(event.target.value);
            setError(null);
            setStatus("");
          }}
        />
        <button
          type="submit"
          className="button button--primary"
          disabled={!canAdd}
        >
          <Plus size={16} aria-hidden /> Add
        </button>
      </div>
      <div className="quick-add__row quick-add__row--secondary">
        <label className="quick-add__field">
          <span>Name</span>
          <input
            type="text"
            placeholder="Optional"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        {folders && folders.length > 0 && onFolderChange && (
          <label className="quick-add__field">
            <span>Add to</span>
            <select
              value={folderId ?? ""}
              onChange={(event) => onFolderChange(event.target.value || null)}
            >
              <option value="">Top level</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name || "Folder"}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {/* Only rendered when there is something to say, so no empty gap */}
      {message && (
        <p
          id={`${id}-msg`}
          className={error ? "field__error" : "hint"}
          role={error ? "alert" : "status"}
        >
          {message}
        </p>
      )}
    </form>
  );
}
