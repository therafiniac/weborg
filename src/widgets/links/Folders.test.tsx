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

  it("adds a folder and moves a link into it from settings", async () => {
    const setData = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <LinksSettings instance={instance} data={data} setData={setData} />,
    );

    await user.click(screen.getByRole("button", { name: /add folder/i }));
    expect((setData.mock.calls[0]![0] as LinksData).items[2]).toMatchObject({
      kind: "folder",
      name: "New folder",
      links: [],
    });

    rerender(
      <LinksSettings instance={instance} data={data} setData={setData} />,
    );
    await user.click(screen.getByRole("button", { name: "Edit Alpha" }));
    await user.selectOptions(screen.getByLabelText("Folder"), "f");
    const moved = setData.mock.calls.at(-1)![0] as LinksData;
    expect(moved.items.map((item) => item.id)).toEqual(["f"]);
    expect(moved.items[0]).toMatchObject({
      links: [{ id: "b" }, { id: "a" }],
    });
  });

  it("asks before deleting a folder that has links", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const setData = vi.fn();
    const user = userEvent.setup();
    render(<LinksSettings instance={instance} data={data} setData={setData} />);
    await user.click(
      screen.getByRole("button", { name: "Remove folder Work" }),
    );
    expect(confirm).toHaveBeenCalledWith(
      'Delete the folder "Work" and its 1 links?',
    );
    expect(setData).not.toHaveBeenCalled();
  });
});
