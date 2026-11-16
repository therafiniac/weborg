export const POSITIONS = [
  "top-left",
  "top-centre",
  "top-right",
  "middle-left",
  "middle-centre",
  "middle-right",
  "bottom-left",
  "bottom-centre",
  "bottom-right",
] as const;

export type Position = (typeof POSITIONS)[number];

export const POSITION_LABELS: Record<Position, string> = {
  "top-left": "Top left",
  "top-centre": "Top centre",
  "top-right": "Top right",
  "middle-left": "Middle left",
  "middle-centre": "Centre",
  "middle-right": "Middle right",
  "bottom-left": "Bottom left",
  "bottom-centre": "Bottom centre",
  "bottom-right": "Bottom right",
};

export const isPosition = (value: unknown): value is Position =>
  typeof value === "string" && (POSITIONS as readonly string[]).includes(value);

/** Group items by position, keeping each group in `order`. */
export function groupByPosition<
  T extends { position: Position; order: number },
>(items: readonly T[]): Map<Position, T[]> {
  const groups = new Map<Position, T[]>();
  for (const item of [...items].sort((a, b) => a.order - b.order)) {
    const group = groups.get(item.position) ?? [];
    group.push(item);
    groups.set(item.position, group);
  }
  return groups;
}
