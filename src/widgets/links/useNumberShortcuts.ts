import { useEffect, useRef } from "react";

/** True when key presses should type text instead of triggering shortcuts. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.closest(".settings-panel") !== null
  );
}

/** Calls handler(index) for keys 1-9, unless the user is typing. */
export function useNumberShortcuts(
  enabled: boolean,
  handler: (index: number) => void,
) {
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        !/^[1-9]$/.test(event.key) ||
        isTypingTarget(event.target)
      )
        return;
      handlerRef.current(Number(event.key) - 1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
