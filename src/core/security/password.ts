import { storage } from "wxt/utils/storage";

import { isRecord } from "@/core/storage/guards";

/**
 * Optional passwords that keep casual onlookers out (page unlock, hidden
 * Todoist tasks). Only a salted PBKDF2 hash is stored, on this device.
 * This is not encryption: anyone with the computer can still reach the
 * data some other way, and the UI says so.
 */

export interface PasswordRecord {
  /** base64 */
  salt: string;
  /** base64 PBKDF2-SHA256 output */
  hash: string;
  iterations: number;
}

/** OWASP's 2023 recommendation for PBKDF2-HMAC-SHA256. */
export const DEFAULT_ITERATIONS = 600_000;
export const MIN_PASSWORD_LENGTH = 4;

const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromBase64 = (text: string) =>
  Uint8Array.from(atob(text), (char) => char.charCodeAt(0));

async function derive(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations },
    key,
    256,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(
  password: string,
  iterations = DEFAULT_ITERATIONS,
): Promise<PasswordRecord> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, iterations);
  return { salt: toBase64(salt), hash: toBase64(hash), iterations };
}

export async function verifyPassword(
  record: PasswordRecord,
  attempt: string,
): Promise<boolean> {
  const expected = fromBase64(record.hash);
  const actual = await derive(
    attempt,
    fromBase64(record.salt),
    record.iterations,
  );
  // Compare every byte so timing does not reveal how much matched
  let difference = expected.length ^ actual.length;
  for (let i = 0; i < expected.length; i++)
    difference |= (expected[i] ?? 0) ^ (actual[i] ?? 0);
  return difference === 0;
}

export function isPasswordRecord(value: unknown): value is PasswordRecord {
  return (
    isRecord(value) &&
    typeof value.salt === "string" &&
    typeof value.hash === "string" &&
    typeof value.iterations === "number"
  );
}

export interface SecuritySettings {
  /** The Weborg password; null when none is set. */
  password: PasswordRecord | null;
  requireForUnlock: boolean;
}

/** Local only and outside settings, so it never syncs or lands in backups. */
export const securityItem = storage.defineItem<SecuritySettings>(
  "local:weborg-security",
  { fallback: { password: null, requireForUnlock: false } },
);

export const MAX_ATTEMPTS = 5;
export const LOCKOUT_MS = 30_000;

/** Slows down guessing: a pause after several wrong passwords in a row. */
export function createAttemptLimiter(now = () => Date.now()) {
  let failures = 0;
  let lockedUntil = 0;
  return {
    /** Milliseconds until another attempt is allowed; 0 when allowed. */
    waitMs: () => Math.max(0, lockedUntil - now()),
    fail() {
      failures += 1;
      if (failures >= MAX_ATTEMPTS) {
        failures = 0;
        lockedUntil = now() + LOCKOUT_MS;
      }
    },
    succeed() {
      failures = 0;
    },
  };
}

/** Shared by every password prompt on the page. */
export const passwordAttempts = createAttemptLimiter();
