import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Links from "./Links";
import LinksSettings from "./LinksSettings";
import type { LinksData } from "./model";
import { glassPreset } from "./style";

const instance = {
  id: "l",
  type: "links",
  position: "middle-centre" as const,
  order: 0,
  display: {},
};

const base: LinksData = {
  items: [
    {
      kind: "link",
      id: "a",
      url: "example.com",
      name: "Example",
      icon: "auto",
    },
    {
      kind: "link",
      id: "b",
      url: "javascript:alert(1)",
      name: "Bad",
      icon: "auto",
    },
  ],
  columns: 4,
  openInNewTab: true,
  shortcuts: true,
  favicons: false,
  style: glassPreset,
};

describe("Quick Links", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders safe links and never renders unsafe URLs as links", () => {
    render(<Links instance={instance} data={base} setData={() => {}} />);
    const nav = screen.getByRole("navigation", { name: "Quick links" });
    const links = within(nav).getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "https://example.com/");
    expect(links[0]).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByText("Bad").closest("a")).toBeNull();
  });

  it("opens links with number keys, but not while typing", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    render(
      <>
        <input aria-label="typing" />
        <Links instance={instance} data={base} setData={() => {}} />
      </>,
    );
    fireEvent.keyDown(screen.getByLabelText("typing"), { key: "1" });
    expect(open).not.toHaveBeenCalled();

    fireEvent.keyDown(document.body, { key: "1" });
    expect(open).toHaveBeenCalledWith(
      "https://example.com/",
      "_blank",
      "noopener",
    );

    // Invalid link at position 2 does nothing
    fireEvent.keyDown(document.body, { key: "2" });
    expect(open).toHaveBeenCalledTimes(1);
  });

  it("adds a link from settings and opens it for editing", async () => {
    const setData = vi.fn();
    const user = userEvent.setup();
    render(<LinksSettings instance={instance} data={base} setData={setData} />);
    await user.click(screen.getByRole("button", { name: /add link/i }));
    const saved = setData.mock.calls[0]![0] as LinksData;
    expect(saved.items).toHaveLength(3);
    expect(saved.items[2]).toMatchObject({ kind: "link", url: "" });
  });

  it("applies a style preset", async () => {
    const setData = vi.fn();
    const user = userEvent.setup();
    render(<LinksSettings instance={instance} data={base} setData={setData} />);
    await user.click(screen.getByRole("button", { name: "Plain" }));
    expect((setData.mock.calls[0]![0] as LinksData).style.mode).toBe("plain");
  });
});
