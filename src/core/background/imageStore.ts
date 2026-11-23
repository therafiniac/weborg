/**
 * Background images live in IndexedDB: they are too large for
 * browser.storage and are never synced.
 */

const DB_NAME = "weborg";
const STORE = "files";
const KEY = "background-image";

export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available"));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function run<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const request = action(db.transaction(STORE, mode).objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

export function validateImage(file: File): string | null {
  if (!file.type.startsWith("image/")) return "Please choose an image file.";
  if (file.size > MAX_IMAGE_BYTES)
    return "That image is larger than 15 MB. Please choose a smaller one.";
  return null;
}

/**
 * "main": the one image, shown in both themes. With separate images on,
 * "dark" and "light" are the per-theme slots; an empty slot falls back to
 * the other slot, then to the main image.
 */
export type ImageVariant = "main" | "dark" | "light";

const ALL_VARIANTS: readonly ImageVariant[] = ["main", "dark", "light"];

const keyFor = (variant: ImageVariant) =>
  variant === "main" ? KEY : `${KEY}-${variant}`;

export const saveBackgroundImage = (
  blob: Blob,
  variant: ImageVariant = "main",
) =>
  run("readwrite", (store) => store.put(blob, keyFor(variant))).then(
    () => undefined,
  );

export const loadBackgroundImage = (variant: ImageVariant = "main") =>
  run<Blob | undefined>("readonly", (store) => store.get(keyFor(variant))).then(
    (blob) => blob ?? null,
  );

/** Without a variant, removes every image. */
export const deleteBackgroundImage = (variant?: ImageVariant) =>
  Promise.all(
    (variant ? [variant] : ALL_VARIANTS).map((v) =>
      run("readwrite", (store) => store.delete(keyFor(v))),
    ),
  ).then(() => undefined);
