import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fakeBrowser } from "wxt/testing/fake-browser";

import {
  defaultBackground,
  lightDefaults,
  themedDefaults,
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

describe("Background defaults by theme", () => {
  it("lightens only the untouched built-in defaults", () => {
    expect(themedDefaults(defaultBackground, "dark")).toBe(defaultBackground);

    const light = themedDefaults(defaultBackground, "light");
    expect(light.gradient.from).toBe(lightDefaults.gradient.from);
    expect(light.colour).toBe(lightDefaults.colour);

    const chosen = {
      ...defaultBackground,
      colour: "#123456",
      gradient: { from: "#000000", to: "#ff0000", angle: 90 },
    };
    expect(themedDefaults(chosen, "light")).toEqual(chosen);
  });
});
