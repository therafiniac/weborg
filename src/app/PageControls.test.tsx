import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fakeBrowser } from "wxt/testing/fake-browser";

import { settingsItem } from "@/core/storage/settings";
import App from "@/entrypoints/newtab/App";

describe("Page controls", () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it("locks the page: no settings, no + tile, no dragging", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("button", { name: "Add a link" });
    expect(document.querySelectorAll(".links__drag").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Lock page" }));
    expect(screen.getByRole("button", { name: "Unlock page" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.queryByRole("button", { name: "Add a link" })).toBeNull();
    expect(document.querySelectorAll(".links__drag")).toHaveLength(0);

    const gear = screen.getByRole("button", { name: "Open settings" });
    expect(gear).toHaveAttribute("aria-disabled", "true");
    await user.click(gear);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Unlock to change settings",
    );

    await waitFor(async () =>
      expect((await settingsItem.getValue()).ui.locked).toBe(true),
    );
  });

  it("unlocks again", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole("button", { name: "Lock page" }));
    await user.click(screen.getByRole("button", { name: "Unlock page" }));
    await user.click(screen.getByRole("button", { name: "Open settings" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("hides and shows all widgets, and remembers it", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await screen.findByText(/^Good (morning|afternoon|evening|night)$/);

    await user.click(screen.getByRole("button", { name: "Hide widgets" }));
    expect(screen.queryByText(/^Good /)).toBeNull();
    expect(screen.queryByRole("searchbox")).toBeNull();
    await waitFor(async () =>
      expect((await settingsItem.getValue()).ui.widgetsHidden).toBe(true),
    );

    // A new tab stays hidden
    unmount();
    render(<App />);
    expect(
      await screen.findByRole("button", { name: "Show widgets" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/^Good /)).toBeNull();

    await user.click(screen.getByRole("button", { name: "Show widgets" }));
    expect(
      await screen.findByText(/^Good (morning|afternoon|evening|night)$/),
    ).toBeInTheDocument();
  });
});

describe("Page controls visibility", () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it("stays revealed while a hint is showing", async () => {
    const user = userEvent.setup();
    render(<App />);
    const lock = await screen.findByRole("button", { name: "Lock page" });
    const bar = lock.closest(".page-controls")!;
    expect(bar).not.toHaveClass("page-controls--active");
    await user.click(lock);
    expect(bar).toHaveClass("page-controls--active");
  });
});
