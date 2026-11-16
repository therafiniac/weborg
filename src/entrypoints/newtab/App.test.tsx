import { render, screen } from "@testing-library/react";
import { fakeBrowser } from "wxt/testing/fake-browser";

import { settingsItem } from "@/core/storage/settings";

import App from "./App";

describe("App", () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it("renders the default Text widget once settings load", async () => {
    render(<App />);
    expect(await screen.findByText("Welcome to Weborg")).toBeInTheDocument();
  });

  it("skips unknown widget types without breaking the page", async () => {
    await settingsItem.setValue({
      widgets: [
        {
          id: "future",
          type: "from-a-newer-version",
          position: "top-left",
          order: 0,
          display: {},
        },
        {
          id: "ok",
          type: "text",
          position: "middle-centre",
          order: 1,
          display: {},
        },
      ],
    });
    render(<App />);
    expect(await screen.findByText("Welcome to Weborg")).toBeInTheDocument();
  });
});
