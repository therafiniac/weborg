import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fakeBrowser } from "wxt/testing/fake-browser";

import {
  backgroundItem,
  defaultBackground,
} from "@/core/background/background";
import { settingsItem } from "@/core/storage/settings";
import App from "@/entrypoints/newtab/App";

describe("Theme", () => {
  beforeEach(() => {
    fakeBrowser.reset();
    delete document.documentElement.dataset.theme;
  });

  it("follows the system by default and switches from the corner", async () => {
    const user = userEvent.setup();
    render(<App />);
    // jsdom has no light preference, so System shows dark
    const toggle = await screen.findByRole("button", {
      name: "Switch to light theme",
    });
    expect(document.documentElement.dataset.theme).toBe("dark");

    await user.click(toggle);
    await waitFor(() =>
      expect(document.documentElement.dataset.theme).toBe("light"),
    );
    expect((await settingsItem.getValue()).appearance.theme).toBe("light");
    expect(
      screen.getByRole("button", { name: "Switch to dark theme" }),
    ).toBeInTheDocument();
  });

  it("can switch while the page is locked", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole("button", { name: "Lock page" }));
    await user.click(
      screen.getByRole("button", { name: "Switch to light theme" }),
    );
    await waitFor(() =>
      expect(document.documentElement.dataset.theme).toBe("light"),
    );
  });
});

describe("Text follows the background", () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it("marks a light background so text turns dark, and back", async () => {
    await backgroundItem.setValue({
      ...defaultBackground,
      kind: "colour",
      colour: "#f4f4f5",
    });
    render(<App />);
    await waitFor(() =>
      expect(document.documentElement.dataset.backdrop).toBe("light"),
    );
    await backgroundItem.setValue({
      ...defaultBackground,
      kind: "colour",
      colour: "#11111b",
    });
    await waitFor(() =>
      expect(document.documentElement.dataset.backdrop).toBe("dark"),
    );
  });

  it("the default background follows the theme", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() =>
      expect(document.documentElement.dataset.backdrop).toBe("dark"),
    );
    await user.click(
      await screen.findByRole("button", { name: "Switch to light theme" }),
    );
    await waitFor(() =>
      expect(document.documentElement.dataset.backdrop).toBe("light"),
    );
  });
});
