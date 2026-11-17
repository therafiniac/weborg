import { FolderPlus } from "lucide-react";
import { useId, useState, type RefObject } from "react";

import { newFolder, type Folder } from "../model";

interface Props {
  onCreate: (folder: Folder) => void;
  nameRef?: RefObject<HTMLInputElement | null>;
  autoFocus?: boolean;
}

/** Name a folder and create it. */
export default function NewFolderForm({ onCreate, nameRef, autoFocus }: Props) {
  const id = useId();
  const [name, setName] = useState("");
  const canCreate = name.trim() !== "";

  return (
    <form
      className="quick-add"
      aria-labelledby={`${id}-title`}
      onSubmit={(event) => {
        event.preventDefault();
        if (canCreate) onCreate(newFolder(name.trim()));
      }}
    >
      <h5 id={`${id}-title`} className="quick-add__title">
        New folder
      </h5>
      <div className="quick-add__row">
        <label className="visually-hidden" htmlFor={`${id}-name`}>
          Folder name
        </label>
        <input
          ref={nameRef}
          id={`${id}-name`}
          className="quick-add__url"
          type="text"
          placeholder="Folder name, e.g. Work"
          autoComplete="off"
          autoFocus={autoFocus}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <button
          type="submit"
          className="button button--primary"
          disabled={!canCreate}
        >
          <FolderPlus size={16} aria-hidden /> Create
        </button>
      </div>
    </form>
  );
}
