import { useEffect, useLayoutEffect, useRef } from "react";

import { placePopover } from "./popover";

interface Options {
  anchor: HTMLElement | null;
  onClose: () => void;
  /** Change to re-measure, e.g. when the content grows. */
  layoutKey?: unknown;
}

/**
 * Shared behaviour for popovers attached to a tile: position next to the
 * anchor (following resize and scroll), focus on open, and close on Esc
 * or a click outside. The anchor itself is ignored so it can toggle.
 *
 * Attach `popoverRef` to the popover, `bodyRef` to its scrolling body (if
 * different) and `focusRef` to the element to focus when it opens.
 */
export function useAnchoredPopover<
  P extends HTMLElement = HTMLDivElement,
  F extends HTMLElement = HTMLElement,
>({ anchor, onClose, layoutKey }: Options) {
  const popoverRef = useRef<P>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const focusRef = useRef<F>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useLayoutEffect(() => {
    const popover = popoverRef.current;
    const body = bodyRef.current ?? popover;
    if (!popover || !body || !anchor) return;

    const place = () => {
      body.style.maxHeight = "";
      const pos = placePopover(
        anchor.getBoundingClientRect(),
        { width: popover.offsetWidth, height: body.scrollHeight },
        { width: window.innerWidth, height: window.innerHeight },
      );
      popover.style.top = `${pos.top}px`;
      popover.style.left = `${pos.left}px`;
      body.style.maxHeight = `${pos.maxHeight}px`;
      popover.style.setProperty("--arrow-left", `${pos.arrowLeft}px`);
      popover.dataset.placement = pos.placement;
      popover.style.visibility = "visible";
    };

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [anchor, layoutKey]);

  useEffect(() => {
    focusRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (popoverRef.current?.contains(target) || anchor?.contains(target))
        return;
      onCloseRef.current();
    };

    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [anchor]);

  return { popoverRef, bodyRef, focusRef };
}
