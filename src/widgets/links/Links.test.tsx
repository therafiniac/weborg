import { fireEvent, render, screen, within } from "@testing-library/react";

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
});

describe("Quick Links layout", () => {
  it("uses no more columns than there are items, so tiles stay centred", () => {
    render(
      <Links
        instance={instance}
        data={{ ...base, columns: 6 }}
        setData={() => {}}
      />,
    );
    const nav = screen.getByRole("navigation", { name: "Quick links" });
    expect(nav.style.getPropertyValue("--links-columns")).toBe("2");
  });
});
