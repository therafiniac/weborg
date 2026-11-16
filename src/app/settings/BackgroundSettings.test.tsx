import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fakeBrowser } from "wxt/testing/fake-browser";

import { backgroundItem } from "@/core/background/background";
import App from "@/entrypoints/newtab/App";

describe("Background settings", () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it("switches background type and keeps the choice", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      await screen.findByRole("button", { name: "Open settings" }),
    );

    await user.selectOptions(screen.getByLabelText("Type"), "colour");
    expect(screen.getByLabelText("Colour")).toBeInTheDocument();
    await waitFor(async () =>
      expect((await backgroundItem.getValue()).kind).toBe("colour"),
    );
  });

  it("saves blur and darken values", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      await screen.findByRole("button", { name: "Open settings" }),
    );

    // jsdom does not move range inputs with arrow keys
    fireEvent.change(screen.getByLabelText(/Darken/), {
      target: { value: "40" },
    });
    fireEvent.change(screen.getByLabelText(/Blur/), { target: { value: "6" } });
    expect(screen.getByLabelText("Darken: 40%")).toBeInTheDocument();
    await waitFor(async () => {
      const saved = await backgroundItem.getValue();
      expect(saved.dim).toBe(40);
      expect(saved.blur).toBe(6);
    });
  });
});
