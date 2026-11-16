import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import Links from "./Links";
import { linksMigrations, type Folder, type LinksData } from "./model";
import { glassPreset } from "./style";

const instance = {
  id: "l",
  type: "links",
  position: "middle-centre" as const,
  order: 0,
  display: {},
};

const link = (id: string, name: string) =>
  ({
    kind: "link",
    id,
    url: `https://${id}.test/`,
    name,
    icon: "auto",
  }) as const;

const base: LinksData = {
  items: [
    link("a", "Alpha"),
    {
      kind: "folder",
      id: "w",
      name: "Work",
      icon: "briefcase",
      links: [link("b", "Bravo")],
    },
  ],
  layout: "grid",
  tabSwitch: "click",
  activeTab: null,
  showAddTile: true,
  lockLinks: false,
  columns: 6,
  openInNewTab: false,
  shortcuts: true,
  favicons: false,
  style: glassPreset,
};

const updates = vi.fn<(data: LinksData) => void>();
const latest = (): LinksData => updates.mock.lastCall?.[0] ?? base;
const work = () =>
  latest().items.find((i): i is Folder => i.kind === "folder")!;

function Harness({ start = base }: { start?: LinksData }) {
  const [data, setData] = useState(start);
  return (
    <Links
      instance={instance}
      data={data}
      setData={(next) => {
        setData(next);
        updates(next);
      }}
    />
  );
}

describe("+ tile", () => {
  beforeEach(() => {
    updates.mockClear();
  });

  it("adds links to the top level from a popover that stays open", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Add a link" }));

    const dialog = screen.getByRole("dialog", { name: "Add a link" });
    const url = within(dialog).getByLabelText("Web address");
    expect(url).toHaveFocus();
    await user.type(url, "one.test{Enter}");
    await user.type(url, "two.test{Enter}");

    expect(
      latest().items.map((i) => (i.kind === "link" ? i.url : i.id)),
    ).toEqual([
      "https://a.test/",
      "w",
      "https://one.test/",
      "https://two.test/",
    ]);
    expect(
      screen.getByRole("dialog", { name: "Add a link" }),
    ).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("adds into an open folder from its own + tile", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: /Work folder/ }));
    await user.click(
      screen.getByRole("button", { name: "Add a link to Work" }),
    );
    await user.type(screen.getByLabelText("Web address"), "docs.test{Enter}");
    expect(work().links.map((l) => l.url)).toEqual([
      "https://b.test/",
      "https://docs.test/",
    ]);
  });

  it("adds to the active tab's folder in the tabs layout", async () => {
    const user = userEvent.setup();
    render(<Harness start={{ ...base, layout: "tabs", activeTab: "w" }} />);
    await user.click(
      screen.getByRole("button", { name: "Add a link to Work" }),
    );
    await user.type(screen.getByLabelText("Web address"), "ci.test{Enter}");
    expect(work().links.map((l) => l.url)).toContain("https://ci.test/");
  });

  it("adds loose links from the Links tab", async () => {
    const user = userEvent.setup();
    render(<Harness start={{ ...base, layout: "tabs" }} />);
    await user.click(screen.getByRole("button", { name: "Add a link" }));
    await user.type(screen.getByLabelText("Web address"), "mail.test{Enter}");
    expect(latest().items.at(-1)).toMatchObject({ url: "https://mail.test/" });
  });

  it("offers a + tile even when there are no links yet", () => {
    render(<Harness start={{ ...base, items: [] }} />);
    expect(
      screen.getByRole("button", { name: "Add a link" }),
    ).toBeInTheDocument();
  });

  it("can be hidden", () => {
    render(<Harness start={{ ...base, showAddTile: false }} />);
    expect(screen.queryByRole("button", { name: /^Add a link/ })).toBeNull();
  });

  it("v3 migration enables the tile without touching other values", () => {
    expect(linksMigrations[3]!({ layout: "tabs" })).toEqual({
      showAddTile: true,
      layout: "tabs",
    });
    expect(linksMigrations[3]!({ showAddTile: false })).toEqual({
      showAddTile: false,
    });
  });
});

describe("page drag and drop", () => {
  it("makes tiles draggable unless links are locked", () => {
    const { container, unmount } = render(<Harness />);
    expect(container.querySelectorAll(".links__drag")).toHaveLength(2);
    unmount();

    const locked = render(<Harness start={{ ...base, lockLinks: true }} />);
    expect(locked.container.querySelectorAll(".links__drag")).toHaveLength(0);
    // Links still work normally when locked
    expect(screen.getByRole("link", { name: "Alpha" })).toBeInTheDocument();
  });

  it("v4 migration unlocks dragging without touching other values", () => {
    expect(linksMigrations[4]!({ layout: "tabs" })).toEqual({
      lockLinks: false,
      layout: "tabs",
    });
    expect(linksMigrations[4]!({ lockLinks: true })).toEqual({
      lockLinks: true,
    });
  });
});

describe("+ tile: new folders", () => {
  beforeEach(() => {
    updates.mockClear();
  });

  it("creates a folder from the page", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Add a link" }));
    await user.click(screen.getByRole("radio", { name: "Folder" }));
    const name = screen.getByLabelText("Folder name");
    expect(name).toHaveFocus();
    expect(screen.getByRole("button", { name: "Create" })).toBeDisabled();

    await user.type(name, "Reading{Enter}");
    expect(latest().items.at(-1)).toMatchObject({
      kind: "folder",
      name: "Reading",
      links: [],
    });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("does not offer folders inside a folder", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: /Work folder/ }));
    await user.click(
      screen.getByRole("button", { name: "Add a link to Work" }),
    );
    expect(screen.queryByRole("radio", { name: "Folder" })).toBeNull();
  });

  it("opens a new folder as the active tab in the tabs layout", async () => {
    const user = userEvent.setup();
    render(<Harness start={{ ...base, layout: "tabs" }} />);
    await user.click(screen.getByRole("button", { name: "Add a link" }));
    await user.click(screen.getByRole("radio", { name: "Folder" }));
    await user.type(screen.getByLabelText("Folder name"), "Fun{Enter}");
    const folder = latest().items.at(-1)!;
    expect(latest().activeTab).toBe(folder.id);
    expect(screen.getByRole("tab", { name: /Fun/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});
