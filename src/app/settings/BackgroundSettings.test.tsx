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

    await user.click(screen.getByRole("radio", { name: "Colour" }));
    expect(screen.getByRole("button", { name: "Paper" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Aurora" })).toBeNull();
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

  it("applies a gradient preset as designed, clearing Darken", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      await screen.findByRole("button", { name: "Open settings" }),
    );

    fireEvent.change(screen.getByLabelText(/Darken/), {
      target: { value: "40" },
    });
    await user.click(screen.getByRole("radio", { name: "Image" }));
    await user.click(screen.getByRole("radio", { name: "Gradient" }));
    await user.click(screen.getByRole("button", { name: "Peach Cream" }));

    expect(screen.getByRole("button", { name: "Peach Cream" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await waitFor(async () => {
      const saved = await backgroundItem.getValue();
      expect(saved.kind).toBe("gradient");
      expect(saved.gradient).toEqual({
        from: "#fde7dc",
        to: "#fbd3c4",
        angle: 135,
      });
      expect(saved.dim).toBe(0);
    });
  });

  it("resets to the default background", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      await screen.findByRole("button", { name: "Open settings" }),
    );

    await user.click(screen.getByRole("radio", { name: "Gradient" }));
    await user.click(screen.getByRole("button", { name: "Ember Night" }));
    await user.click(screen.getByRole("button", { name: /reset background/i }));
    await waitFor(async () =>
      expect(await backgroundItem.getValue()).toEqual(defaultBackground),
    );
    // The default is the Mist dynamic preset
    expect(screen.getByRole("radio", { name: "Dynamic" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("button", { name: "Mist" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("asks before removing an uploaded image", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    await backgroundItem.setValue({
      ...defaultBackground,
      kind: "image",
      image: {
        fit: "cover",
        updatedAt: 1,
        perTheme: false,
        lightUpdatedAt: null,
      },
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

describe("Background type sections", () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it("shows only the presets for the selected type", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      await screen.findByRole("button", { name: "Open settings" }),
    );

    // Default is a dynamic preset
    expect(screen.getByRole("button", { name: "Aurora" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Paper" })).toBeNull();

    await user.click(screen.getByRole("radio", { name: "Image" }));
    expect(screen.queryByRole("button", { name: "Aurora" })).toBeNull();
    expect(
      screen.getByRole("button", { name: /choose image/i }),
    ).toBeInTheDocument();
  });

  it("applies a colour preset", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      await screen.findByRole("button", { name: "Open settings" }),
    );
    await user.click(screen.getByRole("radio", { name: "Colour" }));
    expect(
      screen.getByRole("group", { name: "Dark colours" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Light colours" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sage" }));
    await waitFor(async () =>
      expect(await backgroundItem.getValue()).toMatchObject({
        kind: "colour",
        colour: "#e3ede4",
        dim: 0,
      }),
    );
  });

  it("moves between types with arrow keys", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      await screen.findByRole("button", { name: "Open settings" }),
    );
    screen.getByRole("radio", { name: "Gradient" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Image" })).toHaveFocus();
    expect(screen.getByRole("radio", { name: "Image" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });
});

describe("Images per theme", () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it("offers a second image for the light theme", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      await screen.findByRole("button", { name: "Open settings" }),
    );
    await user.click(screen.getByRole("radio", { name: "Image" }));
    expect(
      screen.queryByRole("button", { name: /light theme image/i }),
    ).toBeNull();

    await user.click(
      screen.getByRole("checkbox", {
        name: "Use a different image for the light theme",
      }),
    );
    expect(
      screen.getByRole("button", { name: "Choose light theme image" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Choose dark theme image" }),
    ).toBeInTheDocument();
    await waitFor(async () =>
      expect((await backgroundItem.getValue()).image.perTheme).toBe(true),
    );
  });
});
