import { CalendarDays } from "lucide-react";
import { useRef } from "react";

/** Calendar button that opens the browser's date picker. */
export default function DateButton({
  value,
  label,
  onChange,
}: {
  /** YYYY-MM-DD, or "" */
  value: string;
  label: string;
  onChange: (date: string) => void;
}) {
  const picker = useRef<HTMLInputElement>(null);

  const open = () => {
    const element = picker.current;
    if (!element) return;
    try {
      element.showPicker();
    } catch {
      // Older browsers: focusing lets the keyboard set the date
      element.focus();
    }
  };

  return (
    <span className="todoist-date">
      <button
        type="button"
        className="todoist__icon-button"
        aria-label={label}
        onClick={open}
      >
        <CalendarDays size={16} />
      </button>
      <input
        ref={picker}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        className="todoist-date__picker"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </span>
  );
}
