import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fakeBrowser } from "wxt/testing/fake-browser";

import {
  backgroundItem,
  defaultBackground,
} from "@/core/background/background";
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

describe("Background presets and reset", () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("applies a gradient preset with its darken level", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      await screen.findByRole("button", { name: "Open settings" }),
    );

    await user.selectOptions(screen.getByLabelText("Type"), "image");
    await user.click(screen.getByRole("button", { name: "Peach Sunset" }));

    expect(
      screen.getByRole("button", { name: "Peach Sunset" }),
    ).toHaveAttribute("aria-pressed", "true");
    await waitFor(async () => {
      const saved = await backgroundItem.getValue();
      expect(saved.kind).toBe("gradient");
      expect(saved.gradient).toEqual({
        from: "#f38ba8",
        to: "#fab387",
        angle: 135,
      });
      expect(saved.dim).toBe(40);
    });
  });

  it("resets to the default background", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      await screen.findByRole("button", { name: "Open settings" }),
    );

    await user.click(screen.getByRole("button", { name: "Ember" }));
    await user.click(screen.getByRole("button", { name: /reset background/i }));
    await waitFor(async () =>
      expect(await backgroundItem.getValue()).toEqual(defaultBackground),
    );
    expect(screen.getByRole("button", { name: "Mocha Night" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("asks before removing an uploaded image", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    await backgroundItem.setValue({
      ...defaultBackground,
      kind: "image",
      image: { fit: "cover", updatedAt: 1 },
    });
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      await screen.findByRole("button", { name: "Open settings" }),
    );
    await user.click(screen.getByRole("button", { name: /reset background/i }));
    expect(confirm).toHaveBeenCalled();
    expect((await backgroundItem.getValue()).kind).toBe("image");
  });
});
