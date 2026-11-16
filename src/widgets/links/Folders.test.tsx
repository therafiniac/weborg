import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Links from "./Links";
import type { LinksData } from "./model";
import { glassPreset } from "./style";

const instance = {
  id: "l",
  type: "links",
  position: "middle-centre" as const,
  order: 0,
  display: {},
};

const data: LinksData = {
  items: [
    { kind: "link", id: "a", url: "a.test", name: "Alpha", icon: "auto" },
    {
      kind: "folder",
      id: "f",
      name: "Work",
      icon: "briefcase",
      links: [
        { kind: "link", id: "b", url: "b.test", name: "Bravo", icon: "auto" },
      ],
    },
  ],
  layout: "grid",
  tabSwitch: "click",
  activeTab: null,
  showAddTile: false,
  lockLinks: false,
  columns: 4,
  openInNewTab: true,
  shortcuts: true,
  favicons: false,
  style: glassPreset,
};

describe("Quick Links folders", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens a folder popup, closes with Esc and restores focus", async () => {
    const user = userEvent.setup();
    render(<Links instance={instance} data={data} setData={() => {}} />);

    const tile = screen.getByRole("button", { name: "Work folder, 1 link" });
    await user.click(tile);
    const dialog = screen.getByRole("dialog", { name: "Work" });
    expect(within(dialog).getByRole("link", { name: "Bravo" })).toHaveAttribute(
      "href",
      "https://b.test/",
    );
    expect(
      within(dialog).getByRole("button", { name: "Close folder" }),
    ).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(tile).toHaveFocus();
  });

  it("number keys open the folder, then links inside it", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    render(<Links instance={instance} data={data} setData={() => {}} />);

    fireEvent.keyDown(document.body, { key: "2" });
    expect(screen.getByRole("dialog", { name: "Work" })).toBeInTheDocument();

    fireEvent.keyDown(document.body, { key: "1" });
    expect(open).toHaveBeenCalledWith("https://b.test/", "_blank", "noopener");
  });

  it("closes on an outside click, or when the tile is clicked again", async () => {
    const user = userEvent.setup();
    render(<Links instance={instance} data={data} setData={() => {}} />);
    await user.click(screen.getByRole("button", { name: /Work folder/ }));
    await user.click(document.body);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    const tile = screen.getByRole("button", { name: /Work folder/ });
    await user.click(tile);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.click(tile);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
