import { groupByPosition, isPosition } from "./positions";

describe("positions", () => {
  it("recognises valid positions", () => {
    expect(isPosition("top-left")).toBe(true);
    expect(isPosition("middle")).toBe(false);
    expect(isPosition(3)).toBe(false);
  });

  it("groups by position in order", () => {
    const groups = groupByPosition([
      { id: "b", position: "top-left", order: 2 },
      { id: "c", position: "bottom-right", order: 1 },
      { id: "a", position: "top-left", order: 0 },
    ] as const);
    expect(groups.get("top-left")?.map((item) => item.id)).toEqual(["a", "b"]);
    expect(groups.get("bottom-right")?.map((item) => item.id)).toEqual(["c"]);
    expect(groups.has("middle-centre")).toBe(false);
  });
});
