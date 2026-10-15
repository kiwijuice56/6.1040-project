import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { SHARING_LOCATION } from "../../src/compositions/location.ts";
import { createSticky } from "../sticky-app.ts";
import { openTestDb, type TestDb } from "../test-db.ts";

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

describe("Sharing location", () => {
  test("its principle: Maya's consent lasts until she withdraws it, and Sam's check stays false", async () => {
    const { browser, signIn } = createSticky(testDb.db);
    const maya = browser();
    const sam = browser();
    await signIn(maya, "maya");
    await signIn(sam, "sam");

    expect(await maya["/location/status"]({ feature: SHARING_LOCATION })).toEqual({ consented: false });
    expect(await maya["/location/consent"]({ feature: SHARING_LOCATION })).toEqual({});
    expect(await maya["/location/status"]({ feature: SHARING_LOCATION })).toEqual({ consented: true });
    expect(await sam["/location/status"]({ feature: SHARING_LOCATION })).toEqual({ consented: false });

    expect(await maya["/location/consent"]({ feature: SHARING_LOCATION })).toEqual({ error: "CONFLICT" });
    expect(await maya["/location/status"]({ feature: SHARING_LOCATION })).toEqual({ consented: true });

    expect(await maya["/location/withdraw"]({ feature: SHARING_LOCATION })).toEqual({});
    expect(await maya["/location/status"]({ feature: SHARING_LOCATION })).toEqual({ consented: false });
    expect(await maya["/location/withdraw"]({ feature: SHARING_LOCATION })).toEqual({ error: "CONFLICT" });
    expect(await maya["/location/status"]({ feature: SHARING_LOCATION })).toEqual({ consented: false });
  });

  test("someone who is not signed in cannot consent, withdraw, or read their status", async () => {
    const { browser } = createSticky(testDb.db);
    const anonymous = browser();
    expect(await anonymous["/location/consent"]({ feature: SHARING_LOCATION })).toEqual({ error: "UNAUTHORIZED" });
    expect(await anonymous["/location/withdraw"]({ feature: SHARING_LOCATION })).toEqual({ error: "UNAUTHORIZED" });
    expect(await anonymous["/location/status"]({ feature: SHARING_LOCATION })).toEqual({ error: "UNAUTHORIZED" });
  });

  test("a feature other than sharingLocation is refused and records no consent", async () => {
    const { browser, signIn } = createSticky(testDb.db);
    const maya = browser();
    await signIn(maya, "maya");

    expect(await maya["/location/consent"]({ feature: "tracking" })).toEqual({ error: "INVALID_REQUEST" });
    expect(await maya["/location/status"]({ feature: SHARING_LOCATION })).toEqual({ consented: false });
    expect(await maya["/location/withdraw"]({ feature: "tracking" })).toEqual({ error: "INVALID_REQUEST" });
    expect(await maya["/location/status"]({ feature: "tracking" })).toEqual({ error: "INVALID_REQUEST" });
  });
});
