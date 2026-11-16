import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { fakeBrowser } from "wxt/testing/fake-browser";

import App from "@/entrypoints/newtab/App";

import LinksSettings from "./LinksSettings";
import type { Folder, LinksData } from "./model";
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

const initial: LinksData = {
  items: [
    link("a", "Alpha"),
    link("b", "Bravo"),
    {
      kind: "folder",
      id: "w",
      name: "Work",
      icon: "briefcase",
      links: [link("c", "Charlie")],
    },
  ],
  layout: "grid",
  tabSwitch: "click",
  activeTab: null,
  showAddTile: false,
  columns: 6,
  openInNewTab: false,
  shortcuts: true,
  favicons: false,
  style: glassPreset,
};

const updates = vi.fn<(data: LinksData) => void>();
const latest = (): LinksData => updates.mock.lastCall?.[0] ?? initial;

/** Holds real state so the settings UI re-renders like in the app. */
function Harness({ start = initial }: { start?: LinksData }) {
  const [data, setData] = useState(start);
  return (
    <LinksSettings
      instance={instance}
      data={data}
      setData={(next) => {
        setData(next);
        updates(next);
      }}
    />
  );
}

const folderOf = (id: string) =>
  latest().items.find((i): i is Folder => i.kind === "folder" && i.id === id)!;

describe("Quick Links settings", () => {
  beforeEach(() => {
    updates.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("quick add", () => {
    it("adds a pasted link on Enter and gets ready for the next one", async () => {
      const user = userEvent.setup();
      render(<Harness />);
      const url = screen.getByLabelText("Web address");
      await user.type(url, "github.com{Enter}");

      expect(latest().items.at(-1)).toMatchObject({
        kind: "link",
        url: "https://github.com/",
      });
      expect(screen.getByText("Added github.com")).toHaveAttribute(
        "role",
        "status",
      );
      expect(url).toHaveValue("");
      expect(url).toHaveFocus();
    });

    it("explains invalid addresses and adds nothing", async () => {
      const user = userEvent.setup();
      render(<Harness />);
      await user.type(screen.getByLabelText("Web address"), "not a url{Enter}");
      expect(screen.getByRole("alert")).toHaveTextContent(/web address/);
      expect(latest().items).toHaveLength(3);
    });

    it("does nothing on an empty submit instead of showing an error", async () => {
      const user = userEvent.setup();
      render(<Harness />);
      expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
      await user.type(screen.getByLabelText("Web address"), "{Enter}");
      expect(screen.queryByRole("alert")).toBeNull();
      expect(updates).not.toHaveBeenCalled();
    });

    it("adds straight into a folder from its menu", async () => {
      const user = userEvent.setup();
      render(<Harness />);
      await user.click(
        screen.getByRole("button", { name: "More actions for folder Work" }),
      );
      await user.click(screen.getByRole("menuitem", { name: "Add link here" }));
      expect(screen.getByLabelText("Add to")).toHaveValue("w");
      expect(screen.getByLabelText("Web address")).toHaveFocus();

      await user.keyboard("docs.test{Enter}");
      expect(folderOf("w").links.map((l) => l.url)).toEqual([
        "https://c.test/",
        "https://docs.test/",
      ]);
    });
  });

  describe("list", () => {
    it("edits only one item at a time", async () => {
      const user = userEvent.setup();
      render(<Harness />);
      await user.click(screen.getByRole("button", { name: "Edit Alpha" }));
      expect(screen.getByLabelText("Address")).toHaveValue("https://a.test/");

      await user.click(
        screen.getByRole("button", { name: "Edit folder Work" }),
      );
      expect(screen.queryByLabelText("Address")).toBeNull();
      expect(screen.getByLabelText("Folder name")).toHaveValue("Work");
      expect(screen.getAllByRole("button", { name: "Done" })).toHaveLength(1);
    });

    it("moves a link into a folder from its editor", async () => {
      const user = userEvent.setup();
      render(<Harness />);
      await user.click(screen.getByRole("button", { name: "Edit Bravo" }));
      const editor = screen.getByLabelText("Address").closest("li")!;
      await user.selectOptions(within(editor).getByLabelText("Folder"), "w");
      expect(folderOf("w").links.map((l) => l.id)).toEqual(["c", "b"]);
    });

    it("reorders and deletes from the ⋮ menu, with undo", async () => {
      const user = userEvent.setup();
      render(<Harness />);
      await user.click(
        screen.getByRole("button", { name: "More actions for Alpha" }),
      );
      await user.click(screen.getByRole("menuitem", { name: "Move down" }));
      expect(latest().items.map((i) => i.id)).toEqual(["b", "a", "w"]);

      await user.click(
        screen.getByRole("button", { name: "More actions for Bravo" }),
      );
      await user.click(screen.getByRole("menuitem", { name: "Delete" }));
      expect(latest().items.map((i) => i.id)).toEqual(["a", "w"]);

      await user.click(screen.getByRole("button", { name: "Undo" }));
      expect(latest().items.map((i) => i.id)).toEqual(["b", "a", "w"]);
    });

    it("closes the menu with Esc and returns focus", async () => {
      const user = userEvent.setup();
      render(<Harness />);
      const trigger = screen.getByRole("button", {
        name: "More actions for Alpha",
      });
      await user.click(trigger);
      expect(screen.getByRole("menuitem", { name: "Move down" })).toHaveFocus();
      await user.keyboard("{Escape}");
      expect(screen.queryByRole("menu")).toBeNull();
      expect(trigger).toHaveFocus();
    });

    it("asks before deleting a folder that has links", async () => {
      const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
      const user = userEvent.setup();
      render(<Harness />);
      await user.click(
        screen.getByRole("button", { name: "More actions for folder Work" }),
      );
      await user.click(screen.getByRole("menuitem", { name: "Delete" }));
      expect(confirm).toHaveBeenCalledWith(
        'Delete the folder "Work" and its 1 links?',
      );
      expect(latest().items).toHaveLength(3);
    });

    it("collapses folders and creates new ones ready to rename", async () => {
      const user = userEvent.setup();
      render(<Harness />);
      const toggle = screen.getByRole("button", {
        name: "Work folder, 1 link",
      });
      await user.click(toggle);
      expect(toggle).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByText("Charlie")).toBeNull();

      await user.click(screen.getByRole("button", { name: "New folder" }));
      expect(latest().items.at(-1)).toMatchObject({
        kind: "folder",
        name: "New folder",
      });
      expect(screen.getByLabelText("Folder name")).toHaveValue("New folder");
    });
  });

  it("keeps layout and style in their own sub-tabs", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(screen.queryByRole("combobox", { name: "Layout" })).toBeNull();

    await user.click(screen.getByRole("tab", { name: "Layout" }));
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Layout" }),
      "tabs",
    );
    expect(latest().layout).toBe("tabs");

    await user.click(screen.getByRole("tab", { name: "Style" }));
    await user.click(screen.getByRole("button", { name: "Plain" }));
    expect(latest().style.mode).toBe("plain");
  });
});

describe("Links settings tab in the app", () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it("has its own tab, and the Widgets list links to it", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      await screen.findByRole("button", { name: "Open settings" }),
    );

    await user.click(screen.getByRole("tab", { name: "Widgets" }));
    await user.click(screen.getByRole("button", { name: "Quick Links" }));
    await user.click(
      screen.getByRole("button", { name: /edit links in the links tab/i }),
    );

    const sections = screen.getByRole("tablist", { name: "Settings sections" });
    expect(
      within(sections).getByRole("tab", { name: "Links" }),
    ).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Your links" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(await screen.findByLabelText("Web address")).toBeInTheDocument();
  });

  it("offers to add a Quick Links widget when there is none", async () => {
    const { settingsItem, defaultSettings } =
      await import("@/core/storage/settings");
    await settingsItem.setValue({
      ...defaultSettings,
      widgets: defaultSettings.widgets.filter((w) => w.type !== "links"),
    });
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      await screen.findByRole("button", { name: "Open settings" }),
    );
    await user.click(screen.getByRole("tab", { name: "Links" }));
    await user.click(screen.getByRole("button", { name: "Add Quick Links" }));
    await waitFor(async () =>
      expect(
        (await settingsItem.getValue()).widgets.some((w) => w.type === "links"),
      ).toBe(true),
    );
  });
});

describe("Quick Links settings drag handles", () => {
  it("gives every link and folder a labelled, keyboard-focusable handle", () => {
    render(<Harness />);
    for (const name of ["Alpha", "Bravo", "folder Work", "Charlie"]) {
      const handle = screen.getByRole("button", { name: `Drag ${name}` });
      expect(handle).toHaveAttribute("aria-roledescription", "sortable");
      expect(handle).toHaveAttribute("tabindex", "0");
    }
  });

  it("shows how to drop into an empty folder", () => {
    render(
      <Harness
        start={{
          ...initial,
          items: [
            ...initial.items,
            {
              kind: "folder",
              id: "e",
              name: "Empty",
              icon: "folder",
              links: [],
            },
          ],
        }}
      />,
    );
    expect(screen.getByText("Empty. Drag links here.")).toBeInTheDocument();
  });
});
