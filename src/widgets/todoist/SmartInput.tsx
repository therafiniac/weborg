import { useLayoutEffect, useRef, type InputHTMLAttributes } from "react";

import { tokenize } from "./syntax";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  value: string;
  onChange: (value: string) => void;
  projectNames: string[];
};

/**
 * A text input that highlights Quick Add syntax. The input's own text is
 * transparent; a mirror behind it draws the same text with highlights.
 */
export default function SmartInput({
  value,
  onChange,
  projectNames,
  className = "",
  ...rest
}: Props) {
  const input = useRef<HTMLInputElement>(null);
  const mirror = useRef<HTMLDivElement>(null);

  const syncScroll = () => {
    if (input.current && mirror.current)
      mirror.current.scrollLeft = input.current.scrollLeft;
  };
  useLayoutEffect(syncScroll, [value]);

  return (
    <div className={`todoist-smart ${className}`}>
      <div ref={mirror} className="todoist-smart__mirror" aria-hidden="true">
        {tokenize(value, projectNames).map((segment, index) =>
          segment.kind ? (
            <mark
              key={index}
              className={`todoist-smart__token todoist-smart__token--${segment.kind}`}
            >
              {segment.text}
            </mark>
          ) : (
            <span key={index}>{segment.text}</span>
          ),
        )}
      </div>
      <input
        {...rest}
        ref={input}
        className="todoist-smart__input"
        value={value}
        spellCheck={false}
        onChange={(event) => onChange(event.target.value)}
        onScroll={syncScroll}
        onSelect={syncScroll}
      />
    </div>
  );
}
