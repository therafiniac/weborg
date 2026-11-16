export interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface PopoverPosition {
  top: number;
  left: number;
  placement: "below" | "above";
  /** Arrow offset from the popover's left edge, in px. */
  arrowLeft: number;
  /** Cap so a long folder scrolls instead of leaving the screen. */
  maxHeight: number;
}

export const POPOVER_MARGIN = 12;
export const POPOVER_GAP = 10;

/**
 * Place a popover next to its anchor: below when it fits, otherwise on the
 * side with more room. Always kept inside the viewport.
 */
export function placePopover(
  anchor: Rect,
  popover: { width: number; height: number },
  viewport: { width: number; height: number },
  margin = POPOVER_MARGIN,
  gap = POPOVER_GAP,
): PopoverPosition {
  const below = viewport.height - (anchor.top + anchor.height) - gap - margin;
  const above = anchor.top - gap - margin;
  const placement =
    popover.height <= below || below >= above ? "below" : "above";
  const maxHeight = Math.max(80, placement === "below" ? below : above);
  const height = Math.min(popover.height, maxHeight);

  const anchorCentre = anchor.left + anchor.width / 2;
  const width = Math.min(popover.width, viewport.width - margin * 2);
  const left = clamp(
    anchorCentre - width / 2,
    margin,
    viewport.width - margin - width,
  );

  return {
    top:
      placement === "below"
        ? anchor.top + anchor.height + gap
        : anchor.top - gap - height,
    left,
    placement,
    // Keep the arrow on the popover, away from its rounded corners
    arrowLeft: clamp(anchorCentre - left, 20, width - 20),
    maxHeight,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}
