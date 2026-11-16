import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
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

describe("Appearance", () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it("applies the global font to the dashboard and saves it", async () => {
    const user = await openSettings();
    const section = screen.getByRole("heading", {
      name: "Appearance",
    }).parentElement!;
    await user.selectOptions(within(section).getByLabelText("Font"), "serif");

    const dashboard = document.querySelector<HTMLElement>(".dashboard")!;
    expect(dashboard.style.getPropertyValue("--dashboard-font")).toContain(
      "Georgia",
    );
    await waitFor(async () =>
      expect((await settingsItem.getValue()).appearance.fontFamily).toBe(
        "serif",
      ),
    );
  });

  it("overrides one widget's colour and resets it", async () => {
    const user = await openSettings();
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Greeting" }));
    await user.click(within(dialog).getByText(/^Style/));

    // jsdom cannot drive the native colour picker; set the value directly
    fireEvent.change(within(dialog).getByLabelText(/^Colour/), {
      target: { value: "#ff0000" },
    });

    const widget = document.querySelector<HTMLElement>(
      '[data-widget-type="greeting"]',
    )!;
    await waitFor(() =>
      expect(widget.style.getPropertyValue("--widget-colour")).toBe("#ff0000"),
    );

    await user.click(
      within(dialog).getByRole("button", { name: "Reset colour" }),
    );
    await waitFor(() =>
      expect(widget.style.getPropertyValue("--widget-colour")).toBe(""),
    );
  });
});
