import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { NotSignedIn, type Session, SessioningConcept } from "../../src/concepts/Sessioning/Sessioning.ts";
import { expectOneWinner } from "../expect-one-winner.ts";
import { openTestDb, type TestDb } from "../test-db.ts";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

let testDb: TestDb;

beforeAll(async () => {
  testDb = await openTestDb();
}, 120_000);

beforeEach(async () => {
  await testDb.db.dropDatabase();
});

afterAll(async () => {
  await testDb.close();
});

function setup() {
  const started = new Date();
  let now = started;
  const clock = () => now;
  const advance = (milliseconds: number) => (now = new Date(now.getTime() + milliseconds));
  return {
    sessioning: new SessioningConcept(testDb.db, "Sessioning", clock),
    database: testDb.db,
    started,
    advance,
  };
}

describe("Sessioning", () => {
  test("its principle: Maya stays signed in until she signs out, leaves a session unused for a week, or reaches 90 days", async () => {
    const { sessioning, started, advance } = setup();

    const { session: laptop, expiresAt } = await sessioning.start({ subject: "maya" });
    expect(expiresAt).toEqual(new Date(started.getTime() + 90 * DAY));
    expect(await sessioning.use({ session: laptop })).toEqual({ subject: "maya" });

    const { session: browser } = await sessioning.start({ subject: "maya" });
    expect(await sessioning.use({ session: browser })).toEqual({ subject: "maya" });
    expect(await sessioning.end({ session: browser })).toEqual({ session: browser });
    await expect(sessioning.use({ session: browser })).rejects.toThrow(NotSignedIn);

    const { session: library } = await sessioning.start({ subject: "maya" });
    for (let day = 1; day < 90; day += 1) {
      advance(DAY);
      expect(await sessioning.use({ session: laptop })).toEqual({ subject: "maya" });
      if (day === 7) {
        const refusal = sessioning.use({ session: library });
        await expect(refusal).rejects.toThrow(NotSignedIn);
        await expect(refusal).rejects.toThrow("Your session has ended. Sign in again.");
      }
    }

    advance(DAY);
    await expect(sessioning.use({ session: laptop })).rejects.toThrow(NotSignedIn);
  });

  test("a session's identity is 32 random bytes in base64url", async () => {
    const { sessioning } = setup();
    const { session: first } = await sessioning.start({ subject: "maya" });
    const { session: second } = await sessioning.start({ subject: "maya" });
    expect(first).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(first).not.toBe(second);
  });

  test("every use sets lastUsed to now, so the week of idleness counts from the latest use", async () => {
    const { sessioning, database, started, advance } = setup();
    const sessions = database.collection<{ _id: string; lastUsed: Date }>("sessioning.sessions");
    const { session } = await sessioning.start({ subject: "maya" });

    advance(MINUTE);
    await sessioning.use({ session });
    expect((await sessions.findOne({ _id: session }))?.lastUsed).toEqual(new Date(started.getTime() + MINUTE));

    advance(7 * DAY - MINUTE);
    expect(await sessioning.use({ session })).toEqual({ subject: "maya" });
    advance(7 * DAY - MINUTE);
    expect(await sessioning.use({ session })).toEqual({ subject: "maya" });
    advance(7 * DAY);
    await expect(sessioning.use({ session })).rejects.toThrow(NotSignedIn);
  });

  test("a refused use or end changes no session", async () => {
    const { sessioning, database, advance } = setup();
    const sessions = database.collection("sessioning.sessions");
    const { session: idle } = await sessioning.start({ subject: "maya" });
    const { session: forgotten } = await sessioning.start({ subject: "sam" });
    const before = await sessions.find().sort({ _id: 1 }).toArray();

    advance(7 * DAY);
    await expect(sessioning.use({ session: idle })).rejects.toThrow(NotSignedIn);
    await expect(sessioning.end({ session: forgotten })).rejects.toThrow(NotSignedIn);
    await expect(sessioning.end({ session: idle })).rejects.toThrow(NotSignedIn);
    expect(await sessions.find().sort({ _id: 1 }).toArray()).toEqual(before);
  });

  test("Sessioning refuses to use or end an unknown or ended session", async () => {
    const { sessioning } = setup();
    await expect(sessioning.use({ session: "missing" as Session })).rejects.toThrow(NotSignedIn);
    await expect(sessioning.end({ session: "missing" as Session })).rejects.toThrow(NotSignedIn);

    const { session } = await sessioning.start({ subject: "maya" });
    await sessioning.end({ session });
    await expect(sessioning.end({ session })).rejects.toThrow(NotSignedIn);
    await expect(sessioning.use({ session })).rejects.toThrow(NotSignedIn);
  });

  test("of two ends of one session at once, Sessioning accepts one and refuses the other with NOT_SIGNED_IN", async () => {
    const { sessioning } = setup();
    const { session } = await sessioning.start({ subject: "maya" });
    await expectOneWinner([sessioning.end({ session }), sessioning.end({ session })], NotSignedIn);
  });
});
