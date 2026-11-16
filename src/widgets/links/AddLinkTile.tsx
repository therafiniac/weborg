import { Plus } from "lucide-react";
import { forwardRef } from "react";

interface Props {
  /** e.g. "Add a link" or "Add a link to Work". */
  label: string;
  expanded: boolean;
  onClick: () => void;
}

/** The "+" tile at the end of a link grid. */
const AddLinkTile = forwardRef<HTMLButtonElement, Props>(function AddLinkTile(
  { label, expanded, onClick },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className="links__item links__add"
      aria-label={label}
      aria-expanded={expanded}
      title={label}
      onClick={onClick}
    >
      <span className="links__icon">
        <Plus aria-hidden />
      </span>
    </button>
  );
});

export default AddLinkTile;
