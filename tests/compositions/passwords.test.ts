import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
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

describe("Passwords", () => {
  test("its principle: Ben signs up with a password, signs out, and logs back in to the same account", async () => {
    const { browser } = createSticky(testDb.db);
    const ben = browser();

    const signedUp = await ben["/auth/register"]({ username: "ben", password: "sea-shells-42" });
    if ("error" in signedUp) throw new Error(JSON.stringify(signedUp));
    expect(await ben["/auth/me"]()).toEqual({ username: "ben" });

    expect(await ben["/auth/logout"]()).toEqual({});
    expect(await ben["/auth/me"]()).toEqual({ error: "UNAUTHORIZED" });

    const loggedIn = await ben["/auth/login"]({ username: "ben", password: "sea-shells-42" });
    if ("error" in loggedIn) throw new Error(JSON.stringify(loggedIn));
    expect(loggedIn.user).toBe(signedUp.user);
    expect(await ben["/auth/me"]()).toEqual({ username: "ben" });
  });

  test("a short password is refused before `ben` is registered, so Ben can sign up again", async () => {
    const { browser } = createSticky(testDb.db);
    const ben = browser();
    expect(await ben["/auth/register"]({ username: "ben", password: "short" })).toEqual({ error: "INVALID_REQUEST" });
    const signedUp = await ben["/auth/register"]({ username: "ben", password: "sea-shells-42" });
    expect("error" in signedUp).toBe(false);
    expect(await ben["/auth/me"]()).toEqual({ username: "ben" });
  });

  test("usernames are unique: Leo can't sign up as `ben`, and an invalid username is refused", async () => {
    const { browser } = createSticky(testDb.db);
    await browser()["/auth/register"]({ username: "ben", password: "sea-shells-42" });
    const leo = browser();
    expect(await leo["/auth/register"]({ username: "ben", password: "leos-password" })).toEqual({ error: "CONFLICT" });
    expect(await leo["/auth/register"]({ username: "b", password: "leos-password" })).toEqual({
      error: "INVALID_REQUEST",
    });
    expect(await leo["/auth/me"]()).toEqual({ error: "UNAUTHORIZED" });
  });

  test("a wrong password and a username nobody has get the same refusal, and sign nobody in", async () => {
    const { browser } = createSticky(testDb.db);
    await browser()["/auth/register"]({ username: "ben", password: "sea-shells-42" });
    const leo = browser();
    expect(await leo["/auth/login"]({ username: "ben", password: "guessed-password" })).toEqual({
      error: "UNAUTHORIZED",
    });
    expect(await leo["/auth/login"]({ username: "nobody", password: "guessed-password" })).toEqual({
      error: "UNAUTHORIZED",
    });
    expect(await leo["/auth/me"]()).toEqual({ error: "UNAUTHORIZED" });
  });

  test("nobody signs up or logs in with a password as Sam, who signed in with Commons", async () => {
    const { browser, signIn } = createSticky(testDb.db);
    await signIn(browser(), "sam");
    const leo = browser();
    expect(await leo["/auth/register"]({ username: "sam", password: "leos-password" })).toEqual({ error: "CONFLICT" });
    expect(await leo["/auth/login"]({ username: "sam", password: "leos-password" })).toEqual({ error: "UNAUTHORIZED" });
  });

  test("a password account can post notes like a Commons account", async () => {
    const { browser } = createSticky(testDb.db);
    const ben = browser();
    await ben["/auth/register"]({ username: "ben", password: "sea-shells-42" });
    const posted = await ben["/posts/create"]({
      body: "Killian grass is closed",
      location: { latitude: 42.3601, longitude: -71.0942 },
    });
    if ("error" in posted) throw new Error(JSON.stringify(posted));
    const listed = await ben["/posts/list"]();
    if ("error" in listed) throw new Error(JSON.stringify(listed));
    expect(listed.posts).toMatchObject([{ post: posted.post, username: "ben" }]);
  });
});
