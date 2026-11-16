import { act, renderHook, waitFor } from "@testing-library/react";
import { fakeBrowser } from "wxt/testing/fake-browser";
import { storage } from "wxt/utils/storage";

import { useStorageItem } from "./useStorageItem";

describe("useStorageItem()", () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it("is undefined until loaded, then returns the stored value", async () => {
    await storage.setItem("local:test-load", 5);
    const item = storage.defineItem<number>("local:test-load", { fallback: 0 });

    const { result } = renderHook(() => useStorageItem(item));
    expect(result.current[0]).toBeUndefined();
    await waitFor(() => expect(result.current[0]).toBe(5));
  });

  it("updates immediately and persists on set", async () => {
    const item = storage.defineItem<number>("local:test-set", { fallback: 0 });
    const { result } = renderHook(() => useStorageItem(item));
    await waitFor(() => expect(result.current[0]).toBe(0));

    await act(() => result.current[1](7));
    expect(result.current[0]).toBe(7);
    expect(await item.getValue()).toBe(7);
  });

  it("reflects changes made elsewhere (e.g. another tab)", async () => {
    const item = storage.defineItem<number>("local:test-watch", {
      fallback: 0,
    });
    const { result } = renderHook(() => useStorageItem(item));
    await waitFor(() => expect(result.current[0]).toBe(0));

    await act(() => storage.setItem("local:test-watch", 3));
    await waitFor(() => expect(result.current[0]).toBe(3));
  });
});
