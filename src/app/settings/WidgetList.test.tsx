import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fakeBrowser } from "wxt/testing/fake-browser";

import { settingsItem } from "@/core/storage/settings";
import App from "@/entrypoints/newtab/App";

async function openSettings() {
  const user = userEvent.setup();
  render(<App />);
  await user.click(
    await screen.findByRole("button", { name: "Open settings" }),
  );
  return user;
}

describe("Widget management", () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens and closes the settings panel with Esc", async () => {
    const user = await openSettings();
    expect(
      screen.getByRole("dialog", { name: "Settings" }),
    ).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open settings" })).toHaveFocus();
  });

  it("adds a widget and saves it", async () => {
    const user = await openSettings();
    await user.click(screen.getByRole("button", { name: /add widget/i }));
    await waitFor(async () =>
      expect((await settingsItem.getValue()).widgets).toHaveLength(3),
    );
  });

  it("edits widget settings live on the page", async () => {
    const user = await openSettings();
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Greeting" }));
    await user.type(
      await within(dialog).findByLabelText("Your name (optional)"),
      "Rafi",
    );
    expect(
      await screen.findByText(/^Good (morning|afternoon|evening|night), Rafi$/),
    ).toBeInTheDocument();
  });

  it("removes a widget after confirmation", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = await openSettings();
    await user.click(screen.getByRole("button", { name: "Remove Greeting" }));
    await waitFor(async () =>
      expect((await settingsItem.getValue()).widgets).toHaveLength(1),
    );
    expect(screen.queryByText(/^Good /)).not.toBeInTheDocument();
  });
});
