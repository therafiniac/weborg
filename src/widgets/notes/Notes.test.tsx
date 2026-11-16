import { act, fireEvent, render, screen } from "@testing-library/react";

import Notes from "./Notes";

const instance = {
  id: "n",
  type: "notes",
  position: "middle-centre" as const,
  order: 0,
  display: {},
};
const data = { text: "", width: 320, rows: 8 };

describe("Notes widget", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("saves after typing pauses, not on every keystroke", () => {
    const setData = vi.fn();
    render(<Notes instance={instance} data={data} setData={setData} />);
    const box = screen.getByRole("textbox", { name: "Notes" });

    fireEvent.change(box, { target: { value: "h" } });
    fireEvent.change(box, { target: { value: "hi" } });
    expect(setData).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(500));
    expect(setData).toHaveBeenCalledTimes(1);
    expect(setData).toHaveBeenCalledWith({ ...data, text: "hi" });
  });

  it("saves immediately on blur and on unmount", () => {
    const setData = vi.fn();
    const { unmount } = render(
      <Notes instance={instance} data={data} setData={setData} />,
    );
    const box = screen.getByRole("textbox", { name: "Notes" });

    fireEvent.change(box, { target: { value: "draft" } });
    fireEvent.blur(box);
    expect(setData).toHaveBeenLastCalledWith({ ...data, text: "draft" });

    fireEvent.change(box, { target: { value: "draft 2" } });
    unmount();
    expect(setData).toHaveBeenLastCalledWith({ ...data, text: "draft 2" });
  });
});
