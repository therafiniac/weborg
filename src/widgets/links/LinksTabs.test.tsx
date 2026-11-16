import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Links from "./Links";
import type { LinksData } from "./model";
import { glassPreset } from "./style";
import { LOOSE_TAB_ID } from "./tabs";

const instance = {
  id: "l",
  type: "links",
  position: "middle-centre" as const,
  order: 0,
  display: {},
};

const link = (id: string, name: string) =>
  ({ kind: "link", id, url: `${id}.test`, name, icon: "auto" }) as const;

const data: LinksData = {
  items: [
    link("a", "Alpha"),
    {
      kind: "folder",
      id: "w",
      name: "Work",
      icon: "briefcase",
      links: [link("b", "Bravo"), link("c", "Charlie")],
    },
    { kind: "folder", id: "e", name: "Empty", icon: "folder", links: [] },
  ],
  layout: "tabs",
  tabSwitch: "click",
  activeTab: null,
  columns: 6,
  openInNewTab: true,
  shortcuts: true,
  favicons: false,
  style: glassPreset,
};

describe("Quick Links tabs layout", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("shows loose links in a first Links tab, then folders", () => {
    render(<Links instance={instance} data={data} setData={() => {}} />);
    const tabs = within(screen.getByRole("tablist")).getAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      "Links1",
      "Work2",
      "Empty0",
    ]);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(
      within(screen.getByRole("tabpanel")).getByRole("link", { name: "Alpha" }),
    ).toBeInTheDocument();
  });

  it("switches and remembers the tab on click", async () => {
    const setData = vi.fn();
    const user = userEvent.setup();
    render(<Links instance={instance} data={data} setData={setData} />);
    await user.click(screen.getByRole("tab", { name: /Work/ }));
    expect(setData).toHaveBeenCalledWith({ ...data, activeTab: "w" });
  });

  it("restores the saved tab and opens its links with number keys", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    render(
      <Links
        instance={instance}
        data={{ ...data, activeTab: "w" }}
        setData={() => {}}
      />,
    );
    expect(screen.getByRole("tab", { name: /Work/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    fireEvent.keyDown(document.body, { key: "2" });
    expect(open).toHaveBeenCalledWith("https://c.test/", "_blank", "noopener");
  });

  it("moves between tabs with arrow keys", async () => {
    const setData = vi.fn();
    const user = userEvent.setup();
    render(<Links instance={instance} data={data} setData={setData} />);
    screen.getByRole("tab", { name: /Links/ }).focus();
    await user.keyboard("{ArrowLeft}");
    expect(setData).toHaveBeenLastCalledWith({ ...data, activeTab: "e" });
    expect(screen.getByRole("tab", { name: /Empty/ })).toHaveFocus();
  });

  it("switches on hover after a short delay when enabled", () => {
    vi.useFakeTimers();
    const setData = vi.fn();
    render(
      <Links
        instance={instance}
        data={{ ...data, tabSwitch: "hover" }}
        setData={setData}
      />,
    );
    fireEvent.pointerEnter(screen.getByRole("tab", { name: /Work/ }));
    expect(setData).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(200));
    expect(setData).toHaveBeenCalledWith({
      ...data,
      tabSwitch: "hover",
      activeTab: "w",
    });
  });

  it("does not switch on hover in click mode", () => {
    vi.useFakeTimers();
    const setData = vi.fn();
    render(<Links instance={instance} data={data} setData={setData} />);
    fireEvent.pointerEnter(screen.getByRole("tab", { name: /Work/ }));
    act(() => vi.advanceTimersByTime(500));
    expect(setData).not.toHaveBeenCalled();
  });

  it("explains empty folders", () => {
    render(
      <Links
        instance={instance}
        data={{ ...data, activeTab: "e" }}
        setData={() => {}}
      />,
    );
    expect(screen.getByText(/Empty is empty/)).toBeInTheDocument();
  });

  it("hides the Links tab when every link is in a folder", () => {
    render(
      <Links
        instance={instance}
        data={{ ...data, items: data.items.slice(1) }}
        setData={() => {}}
      />,
    );
    expect(screen.queryByRole("tab", { name: /^Links/ })).toBeNull();
    expect(LOOSE_TAB_ID).toBe("loose-links");
  });
});
