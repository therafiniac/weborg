import {
  createAttemptLimiter,
  hashPassword,
  LOCKOUT_MS,
  MAX_ATTEMPTS,
  verifyPassword,
} from "./password";

// Few iterations keep the tests fast; the stored count is what verify uses
const FAST = 1000;

describe("password hashing", () => {
  it("accepts the right password and rejects others", async () => {
    const record = await hashPassword("open sesame", FAST);
    expect(await verifyPassword(record, "open sesame")).toBe(true);
    expect(await verifyPassword(record, "open sesame ")).toBe(false);
    expect(await verifyPassword(record, "")).toBe(false);
  });

  it("never stores the password and salts every hash", async () => {
    const a = await hashPassword("same", FAST);
    const b = await hashPassword("same", FAST);
    expect(JSON.stringify(a)).not.toContain("same");
    expect(a.salt).not.toBe(b.salt);
    expect(a.hash).not.toBe(b.hash);
  });

  it("uses a strong default work factor", async () => {
    expect((await hashPassword("x")).iterations).toBe(600_000);
  });
});

describe("attempt limiter", () => {
  it("pauses after too many wrong tries, then allows again", () => {
    let time = 0;
    const limiter = createAttemptLimiter(() => time);
    for (let i = 0; i < MAX_ATTEMPTS - 1; i++) limiter.fail();
    expect(limiter.waitMs()).toBe(0);

    limiter.fail();
    expect(limiter.waitMs()).toBe(LOCKOUT_MS);

    time += LOCKOUT_MS;
    expect(limiter.waitMs()).toBe(0);
  });

  it("forgets earlier failures after a success", () => {
    const limiter = createAttemptLimiter(() => 0);
    for (let i = 0; i < MAX_ATTEMPTS - 1; i++) limiter.fail();
    limiter.succeed();
    limiter.fail();
    expect(limiter.waitMs()).toBe(0);
  });
});
