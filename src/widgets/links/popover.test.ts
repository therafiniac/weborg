import { placePopover } from "./popover";

const viewport = { width: 1600, height: 1000 };
const size = { width: 400, height: 200 };

describe("placePopover()", () => {
  it("opens below the tile, centred on it", () => {
    const pos = placePopover(
      { top: 600, left: 700, width: 128, height: 48 },
      size,
      viewport,
    );
    expect(pos.placement).toBe("below");
    expect(pos.top).toBe(658);
    expect(pos.left).toBe(564); // 764 centre - 200
    expect(pos.arrowLeft).toBe(200);
  });

  it("flips above when there is no room below", () => {
    const pos = placePopover(
      { top: 900, left: 700, width: 128, height: 48 },
      size,
      viewport,
    );
    expect(pos.placement).toBe("above");
    expect(pos.top).toBe(900 - 10 - 200);
  });

  it("stays inside the screen edges and points the arrow at the tile", () => {
    const pos = placePopover(
      { top: 100, left: 1500, width: 80, height: 48 },
      size,
      viewport,
    );
    expect(pos.left).toBe(1600 - 12 - 400);
    expect(pos.arrowLeft).toBe(1540 - pos.left);

    const leftEdge = placePopover(
      { top: 100, left: 0, width: 40, height: 48 },
      size,
      viewport,
    );
    expect(leftEdge.left).toBe(12);
    expect(leftEdge.arrowLeft).toBe(20); // clamped away from the corner
  });

  it("caps height to the larger side so long folders scroll", () => {
    const pos = placePopover(
      { top: 400, left: 700, width: 128, height: 48 },
      { width: 400, height: 2000 },
      viewport,
    );
    expect(pos.placement).toBe("below");
    expect(pos.maxHeight).toBe(1000 - 448 - 10 - 12);
  });
});
