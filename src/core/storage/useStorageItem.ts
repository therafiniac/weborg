import { useSyncExternalStore } from "react";
import type { WxtStorageItem } from "wxt/utils/storage";

type AnyItem<T> = WxtStorageItem<T, Record<string, unknown>>;

type Store<T> = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => T | undefined;
  set: (value: T) => Promise<void>;
};

// One cached store per storage item, shared by every component using it
const stores = new WeakMap<object, Store<unknown>>();

function createStore<T>(item: AnyItem<T>): Store<T> {
  let value: T | undefined;
  let loaded = false;
  let unwatch: (() => void) | undefined;
  const listeners = new Set<() => void>();

  const publish = (next: T) => {
    value = next;
    loaded = true;
    listeners.forEach((listener) => listener());
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      if (listeners.size === 1) {
        if (!loaded) {
          item
            .getValue()
            .then(publish)
            .catch((error: unknown) =>
              console.error("Weborg: failed to read storage", error),
            );
        }
        unwatch = item.watch(publish);
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          unwatch?.();
          unwatch = undefined;
          // Unwatched values can go stale; force a fresh read next time
          value = undefined;
          loaded = false;
        }
      };
    },
    getSnapshot: () => value,
    async set(next) {
      // Optimistic: render immediately, then persist
      publish(next);
      await item.setValue(next);
    },
  };
}

function getStore<T>(item: AnyItem<T>): Store<T> {
  let store = stores.get(item) as Store<T> | undefined;
  if (!store) {
    store = createStore(item);
    stores.set(item, store as Store<unknown>);
  }
  return store;
}

/**
 * Subscribe a component to a WXT storage item.
 *
 * Returns `undefined` until the first read finishes, so callers can avoid
 * flashing defaults. Updates from other tabs arrive through `watch`.
 */
export function useStorageItem<T>(
  item: AnyItem<T>,
): [T | undefined, (value: T) => Promise<void>] {
  const store = getStore(item);
  const value = useSyncExternalStore(store.subscribe, store.getSnapshot);
  return [value, store.set];
}
