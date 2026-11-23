import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fakeBrowser } from "wxt/testing/fake-browser";

import {
  hashPassword,
  securityItem,
  verifyPassword,
} from "@/core/security/password";
import { settingsItem } from "@/core/storage/settings";
import App from "@/entrypoints/newtab/App";

import PasswordSettings from "./PasswordSettings";

const withPassword = async (requireForUnlock = false) =>
  securityItem.setValue({
    password: await hashPassword("letmein", 1000),
    requireForUnlock,
  });

describe("Password settings", () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it("sets a password after it is repeated correctly", async () => {
    const user = userEvent.setup();
    render(<PasswordSettings />);
    await user.type(await screen.findByLabelText("New password"), "abcd");
    await user.type(screen.getByLabelText("Repeat the password"), "abce");
    await user.click(screen.getByRole("button", { name: "Set password" }));
    expect(screen.getByRole("alert")).toHaveTextContent("do not match");

    await user.clear(screen.getByLabelText("Repeat the password"));
    await user.type(screen.getByLabelText("Repeat the password"), "abcd");
    await user.click(screen.getByRole("button", { name: "Set password" }));

    expect(await screen.findByText("Password set.")).toBeInTheDocument();
    const { password } = await securityItem.getValue();
    expect(password && (await verifyPassword(password, "abcd"))).toBe(true);
  });

  it("rejects passwords that are too short", async () => {
    const user = userEvent.setup();
    render(<PasswordSettings />);
    await user.type(await screen.findByLabelText("New password"), "abc");
    await user.type(screen.getByLabelText("Repeat the password"), "abc");
    await user.click(screen.getByRole("button", { name: "Set password" }));
    expect(screen.getByRole("alert")).toHaveTextContent("at least 4");
    expect((await securityItem.getValue()).password).toBeNull();
  });

  it("needs the password to stop asking for it on unlock", async () => {
    const user = userEvent.setup();
    await withPassword(true);
    render(<PasswordSettings />);

    await user.click(
      await screen.findByRole("checkbox", {
        name: "Require password to unlock the page",
      }),
    );
    const current = screen.getByLabelText("Current password");
    await user.type(current, "nope{Enter}");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Wrong password.",
    );
    expect((await securityItem.getValue()).requireForUnlock).toBe(true);

    await user.type(
      screen.getByLabelText("Current password"),
      "letmein{Enter}",
    );
    await waitFor(async () =>
      expect((await securityItem.getValue()).requireForUnlock).toBe(false),
    );
  });

  it("removes the password only with the current one", async () => {
    const user = userEvent.setup();
    await withPassword(true);
    render(<PasswordSettings />);
    await user.click(
      await screen.findByRole("button", { name: "Remove password" }),
    );
    await user.type(
      screen.getByLabelText("Current password"),
      "letmein{Enter}",
    );

    expect(await screen.findByText("Password removed.")).toBeInTheDocument();
    expect(await securityItem.getValue()).toEqual({
      password: null,
      requireForUnlock: false,
    });
  });
});

describe("Unlocking with a password", () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it("asks for the password before unlocking the page", async () => {
    const user = userEvent.setup();
    await withPassword(true);
    render(<App />);
    await user.click(await screen.findByRole("button", { name: "Lock page" }));

    await user.click(screen.getByRole("button", { name: "Unlock page" }));
    await user.type(
      await screen.findByLabelText("Password to unlock"),
      "wrong{Enter}",
    );
    expect(await screen.findByText("Wrong password.")).toBeInTheDocument();
    expect((await settingsItem.getValue()).ui.locked).toBe(true);

    await user.type(
      screen.getByLabelText("Password to unlock"),
      "letmein{Enter}",
    );
    await waitFor(async () =>
      expect((await settingsItem.getValue()).ui.locked).toBe(false),
    );
    expect(screen.queryByLabelText("Password to unlock")).toBeNull();
  });

  it("locking never asks, and no password means no prompt", async () => {
    const user = userEvent.setup();
    await withPassword(false);
    render(<App />);
    await user.click(await screen.findByRole("button", { name: "Lock page" }));
    await user.click(screen.getByRole("button", { name: "Unlock page" }));
    expect(screen.queryByLabelText("Password to unlock")).toBeNull();
    await waitFor(async () =>
      expect((await settingsItem.getValue()).ui.locked).toBe(false),
    );
  });
});

describe("Showing a typed password", () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it("offers a show button in settings that starts hidden", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<PasswordSettings />);
    const field = await screen.findByLabelText("New password");
    expect(field).toHaveAttribute("type", "password");

    const [show] = screen.getAllByRole("button", { name: "Show password" });
    await user.click(show!);
    expect(field).toHaveAttribute("type", "text");

    // Never remembered: it is hidden again next time
    unmount();
    render(<PasswordSettings />);
    expect(await screen.findByLabelText("New password")).toHaveAttribute(
      "type",
      "password",
    );
  });

  it("has no show button on the page's unlock prompt", async () => {
    const user = userEvent.setup();
    await withPassword(true);
    render(<App />);
    await user.click(await screen.findByRole("button", { name: "Lock page" }));
    await user.click(screen.getByRole("button", { name: "Unlock page" }));
    await screen.findByLabelText("Password to unlock");
    expect(screen.queryByRole("button", { name: "Show password" })).toBeNull();
  });
});
