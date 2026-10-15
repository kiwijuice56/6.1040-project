import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { createSticky, type StickyApi } from "../sticky-app.ts";
import { openTestDb, type TestDb } from "../test-db.ts";

const mit = { latitude: 42.3601, longitude: -71.0942 };

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

describe("Posting", () => {
  test("its principle: Maya posts, Sam upvotes, Maya edits, and deleting the note clears Sam's vote", async () => {
    const { browser, signIn } = createSticky(testDb.db);
    const maya = browser();
    const sam = browser();
    const publicList = browser();
    await signIn(maya, "maya");
    await signIn(sam, "sam");

    const created = await maya["/posts/create"]({ body: "Killian grass is closed", location: mit });
    if ("error" in created) throw new Error(JSON.stringify(created));
    const { post } = created;

    expect(await notes(publicList)).toEqual([
      { post, body: "Killian grass is closed", author: expect.any(String), location: mit, username: "maya", count: 0 },
    ]);

    expect(await sam["/posts/upvote"]({ post })).toEqual({ post });
    expect(await sam["/posts/vote"]({ post })).toEqual({ upvote: true });
    expect(await maya["/posts/vote"]({ post })).toEqual({});
    expect(await notes(publicList)).toEqual([
      { post, body: "Killian grass is closed", author: expect.any(String), location: mit, username: "maya", count: 1 },
    ]);

    expect(await maya["/posts/edit"]({ post, body: "Killian grass is open" })).toEqual({ post });
    expect(await notes(publicList)).toEqual([
      { post, body: "Killian grass is open", author: expect.any(String), location: mit, username: "maya", count: 1 },
    ]);
    expect(await sam["/posts/vote"]({ post })).toEqual({ upvote: true });

    expect(await maya["/posts/delete"]({ post })).toEqual({ post });
    expect(await notes(publicList)).toEqual([]);
    expect(await sam["/posts/vote"]({ post })).toEqual({});
    expect(await sam["/posts/unvote"]({ post })).toEqual({ error: "NOT_FOUND" });
  });

  test("someone who is not signed in cannot post, edit, delete, or vote, and nothing is stored", async () => {
    const { browser, signIn } = createSticky(testDb.db);
    const maya = browser();
    const anonymous = browser();
    await signIn(maya, "maya");
    const created = await maya["/posts/create"]({ body: "Don't walk here", location: mit });
    if ("error" in created) throw new Error(JSON.stringify(created));
    const { post } = created;

    expect(await anonymous["/posts/create"]({ body: "a note", location: mit })).toEqual({ error: "UNAUTHORIZED" });
    expect(await anonymous["/posts/edit"]({ post, body: "changed" })).toEqual({ error: "UNAUTHORIZED" });
    expect(await anonymous["/posts/delete"]({ post })).toEqual({ error: "UNAUTHORIZED" });
    expect(await anonymous["/posts/upvote"]({ post })).toEqual({ error: "UNAUTHORIZED" });
    expect(await anonymous["/posts/downvote"]({ post })).toEqual({ error: "UNAUTHORIZED" });
    expect(await anonymous["/posts/unvote"]({ post })).toEqual({ error: "UNAUTHORIZED" });
    expect(await anonymous["/posts/vote"]({ post })).toEqual({ error: "UNAUTHORIZED" });
    expect(await notes(anonymous)).toEqual([
      { post, body: "Don't walk here", author: expect.any(String), location: mit, username: "maya", count: 0 },
    ]);
  });

  test("signing out ends the session, so the next post is refused", async () => {
    const { browser, signIn } = createSticky(testDb.db);
    const maya = browser();
    await signIn(maya, "maya");
    expect(await maya["/auth/logout"]()).toEqual({});
    expect(await maya["/posts/create"]({ body: "after sign-out", location: mit })).toEqual({ error: "UNAUTHORIZED" });
    expect(await maya["/auth/me"]()).toEqual({ error: "UNAUTHORIZED" });
    expect(await notes(browser())).toEqual([]);
  });

  test("someone who is not the author cannot edit or delete, and the votes stay", async () => {
    const { browser, signIn } = createSticky(testDb.db);
    const maya = browser();
    const sam = browser();
    await signIn(maya, "maya");
    await signIn(sam, "sam");
    const created = await maya["/posts/create"]({ body: "Stata's doors", location: mit });
    if ("error" in created) throw new Error(JSON.stringify(created));
    const { post } = created;
    expect(await sam["/posts/upvote"]({ post })).toEqual({ post });

    expect(await sam["/posts/edit"]({ post, body: "stolen" })).toEqual({ error: "FORBIDDEN" });
    expect(await sam["/posts/delete"]({ post })).toEqual({ error: "FORBIDDEN" });
    expect(await notes(browser())).toEqual([
      { post, body: "Stata's doors", author: expect.any(String), location: mit, username: "maya", count: 1 },
    ]);
    expect(await sam["/posts/vote"]({ post })).toEqual({ upvote: true });
  });

  test("create and edit refuse an empty body or a bad location and leave the notes as they were", async () => {
    const { browser, signIn } = createSticky(testDb.db);
    const maya = browser();
    await signIn(maya, "maya");

    expect(await maya["/posts/create"]({ body: "", location: mit })).toEqual({ error: "INVALID_REQUEST" });
    expect(await maya["/posts/create"]({ body: "   ", location: mit })).toEqual({ error: "INVALID_REQUEST" });
    expect(await maya["/posts/create"]({ body: "north pole", location: { latitude: 91, longitude: 0 } })).toEqual({
      error: "INVALID_REQUEST",
    });
    expect(await maya["/posts/create"]({ body: "nowhere", location: { latitude: Number.NaN, longitude: 0 } })).toEqual({
      error: "INVALID_REQUEST",
    });
    expect(await notes(browser())).toEqual([]);

    const created = await maya["/posts/create"]({ body: "a note", location: mit });
    if ("error" in created) throw new Error(JSON.stringify(created));
    expect(await maya["/posts/edit"]({ post: created.post, body: "" })).toEqual({ error: "INVALID_REQUEST" });
    expect(await maya["/posts/edit"]({ post: created.post, body: "   " })).toEqual({ error: "INVALID_REQUEST" });
    expect(await notes(browser())).toEqual([
      { post: created.post, body: "a note", author: expect.any(String), location: mit, username: "maya", count: 0 },
    ]);
  });

  test("a second vote conflicts, and unvoting when there is no vote is not found", async () => {
    const { browser, signIn } = createSticky(testDb.db);
    const maya = browser();
    const sam = browser();
    await signIn(maya, "maya");
    await signIn(sam, "sam");
    const created = await maya["/posts/create"]({ body: "a note", location: mit });
    if ("error" in created) throw new Error(JSON.stringify(created));
    const { post } = created;

    expect(await sam["/posts/unvote"]({ post })).toEqual({ error: "NOT_FOUND" });
    expect(await sam["/posts/upvote"]({ post })).toEqual({ post });
    expect(await sam["/posts/upvote"]({ post })).toEqual({ error: "CONFLICT" });
    expect(await sam["/posts/downvote"]({ post })).toEqual({ error: "CONFLICT" });
    expect((await notes(browser()))[0]?.count).toBe(1);

    expect(await sam["/posts/unvote"]({ post })).toEqual({ post });
    expect(await sam["/posts/downvote"]({ post })).toEqual({ post });
    expect(await sam["/posts/vote"]({ post })).toEqual({ upvote: false });
    expect((await notes(browser()))[0]?.count).toBe(-1);
  });

  test("editing or deleting an unknown note is not found and leaves the real note", async () => {
    const { browser, signIn } = createSticky(testDb.db);
    const maya = browser();
    await signIn(maya, "maya");
    const created = await maya["/posts/create"]({ body: "a note", location: mit });
    if ("error" in created) throw new Error(JSON.stringify(created));
    const missing = crypto.randomUUID() as typeof created.post;

    expect(await maya["/posts/edit"]({ post: missing, body: "ghost" })).toEqual({ error: "NOT_FOUND" });
    expect(await maya["/posts/delete"]({ post: missing })).toEqual({ error: "NOT_FOUND" });
    expect(await notes(browser())).toEqual([
      { post: created.post, body: "a note", author: expect.any(String), location: mit, username: "maya", count: 0 },
    ]);
  });

  test("the note's author is the session, even when the body names someone else", async () => {
    const { browser, signIn } = createSticky(testDb.db);
    const maya = browser();
    const sam = browser();
    const { user: mayaId } = await signIn(maya, "maya");
    await signIn(sam, "sam");

    const input = { body: "from the session", location: mit, user: mayaId };
    const created = await sam["/posts/create"](input as { body: string; location: typeof mit });
    if ("error" in created) throw new Error(JSON.stringify(created));
    const [note] = await notes(browser());
    expect(note).toMatchObject({ post: created.post, body: "from the session", username: "sam" });
    expect(note?.author).not.toBe(mayaId);
  });
});

async function notes(api: StickyApi) {
  const listed = await api["/posts/list"]();
  if ("error" in listed) throw new Error(JSON.stringify(listed));
  return listed.posts;
}
