import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Search from "./Search";

const instance = {
  id: "s",
  type: "search",
  position: "middle-centre" as const,
  order: 0,
  display: {},
};

describe("Search widget", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens results in a new tab when enabled", async () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    const user = userEvent.setup();
    render(
      <Search
        instance={instance}
        data={{ engine: "duckduckgo", customUrl: "", openInNewTab: true }}
        setData={() => {}}
      />,
    );
    await user.type(
      screen.getByRole("searchbox", { name: "Search with DuckDuckGo" }),
      "weborg{Enter}",
    );
    expect(open).toHaveBeenCalledWith(
      "https://duckduckgo.com/?q=weborg",
      "_blank",
      "noopener",
    );
  });

  it("ignores empty searches", async () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    const user = userEvent.setup();
    render(
      <Search
        instance={instance}
        data={{ engine: "google", customUrl: "", openInNewTab: true }}
        setData={() => {}}
      />,
    );
    await user.type(screen.getByRole("searchbox"), "   {Enter}");
    expect(open).not.toHaveBeenCalled();
  });
});
