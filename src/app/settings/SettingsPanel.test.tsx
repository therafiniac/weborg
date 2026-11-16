import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fakeBrowser } from "wxt/testing/fake-browser";

import App from "@/entrypoints/newtab/App";

async function openSettings() {
  const user = userEvent.setup();
  render(<App />);
  await user.click(
    await screen.findByRole("button", { name: "Open settings" }),
  );
  return user;
}

describe("Settings panel layout", () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it("shows one section at a time, starting with Background", async () => {
    const user = await openSettings();
    const tabs = within(
      screen.getByRole("tablist", { name: "Settings sections" }),
    )
      .getAllByRole("tab")
      .map((tab) => tab.textContent);
    expect(tabs).toEqual(["Background", "Appearance", "Widgets", "Backup"]);
    expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Background");
    expect(screen.queryByRole("button", { name: /add widget/i })).toBeNull();

    await user.click(screen.getByRole("tab", { name: "Widgets" }));
    expect(
      screen.getByRole("button", { name: /add widget/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "Gradient" })).toBeNull();
  });

  it("moves between sections with arrow keys", async () => {
    const user = await openSettings();
    screen.getByRole("tab", { name: "Background" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Appearance" })).toHaveFocus();
    expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Appearance");
  });

  it("remembers the last section next time it opens", async () => {
    const user = await openSettings();
    await user.click(screen.getByRole("tab", { name: "Backup" }));
    await user.click(screen.getByRole("button", { name: "Close settings" }));
    await user.click(screen.getByRole("button", { name: "Open settings" }));
    expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Backup");
  });

  it("maximises and restores the panel size", async () => {
    const user = await openSettings();
    await user.click(screen.getByRole("button", { name: "Maximise settings" }));
    expect(screen.getByRole("dialog")).toHaveClass("settings-panel--maximised");
    expect(screen.getByRole("tablist")).toHaveAttribute(
      "aria-orientation",
      "vertical",
    );
    await user.click(
      screen.getByRole("button", { name: "Restore settings size" }),
    );
    expect(screen.getByRole("dialog")).not.toHaveClass(
      "settings-panel--maximised",
    );
  });

  it("minimises to a corner bar and restores to the same place", async () => {
    const user = await openSettings();
    await user.click(screen.getByRole("tab", { name: "Appearance" }));
    await user.click(screen.getByRole("button", { name: "Minimise settings" }));

    const bar = screen.getByRole("dialog", {
      name: "Settings, minimised: Appearance",
    });
    expect(
      within(bar).getByRole("button", { name: "Restore settings" }),
    ).toHaveFocus();
    expect(screen.queryByRole("tabpanel")).toBeNull();

    await user.click(
      within(bar).getByRole("button", { name: "Restore settings" }),
    );
    expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Appearance");
  });

  it("closes from the minimised bar and returns focus to the gear", async () => {
    const user = await openSettings();
    await user.click(screen.getByRole("button", { name: "Minimise settings" }));
    await user.click(screen.getByRole("button", { name: "Close settings" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: "Open settings" })).toHaveFocus();
  });
});
