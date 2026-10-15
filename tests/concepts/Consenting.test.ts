import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import {
  AlreadyConsented,
  ConsentingConcept,
  NotConsented,
} from "../../src/concepts/Consenting/Consenting.ts";
import { expectOneWinner } from "../expect-one-winner.ts";
import { openTestDb, type TestDb } from "../test-db.ts";

let testDb: TestDb;
let consenting: ConsentingConcept<string, string>;

beforeAll(async () => {
  testDb = await openTestDb();
}, 120_000);

beforeEach(async () => {
  await testDb.db.dropDatabase();
  consenting = new ConsentingConcept(testDb.db);
});

afterAll(async () => {
  await testDb.close();
});

describe("Consenting", () => {
  test("its principle: Maya's consent counts from when she gives it until she withdraws it", async () => {
    expect(await consenting.consent({ person: "maya", use: "description" })).toEqual({
      person: "maya",
      use: "description",
    });
    expect(await consenting._consented({ person: "maya", use: "description" })).toEqual({ consented: true });

    expect(await consenting.withdraw({ person: "maya", use: "description" })).toEqual({
      person: "maya",
      use: "description",
    });
    expect(await consenting._consented({ person: "maya", use: "description" })).toEqual({ consented: false });

    expect(await consenting._consented({ person: "sam", use: "description" })).toEqual({ consented: false });

    const refusal = consenting.withdraw({ person: "maya", use: "description" });
    await expect(refusal).rejects.toThrow(NotConsented);
    await expect(refusal).rejects.toThrow("You haven't consented to this.");
  });

  test("one person's consent to one use doesn't extend to another person or another use", async () => {
    await consenting.consent({ person: "maya", use: "description" });
    expect(await consenting._consented({ person: "sam", use: "description" })).toEqual({ consented: false });
    expect(await consenting._consented({ person: "maya", use: "training" })).toEqual({ consented: false });
  });

  test("a person can't consent to the same use twice", async () => {
    await consenting.consent({ person: "maya", use: "description" });
    const refusal = consenting.consent({ person: "maya", use: "description" });
    await expect(refusal).rejects.toThrow(AlreadyConsented);
    await expect(refusal).rejects.toThrow("You have already consented to this.");
    expect(await consenting._consented({ person: "maya", use: "description" })).toEqual({ consented: true });
  });

  test("of two consents to one use at once, Consenting accepts one, so one withdrawal takes the consent back", async () => {
    await expectOneWinner(
      [
        consenting.consent({ person: "maya", use: "description" }),
        consenting.consent({ person: "maya", use: "description" }),
      ],
      AlreadyConsented,
    );
    await consenting.withdraw({ person: "maya", use: "description" });
    expect(await consenting._consented({ person: "maya", use: "description" })).toEqual({ consented: false });
  });

  test("a person can't withdraw a consent they never gave", async () => {
    await expect(consenting.withdraw({ person: "sam", use: "description" })).rejects.toThrow(NotConsented);
  });
});
