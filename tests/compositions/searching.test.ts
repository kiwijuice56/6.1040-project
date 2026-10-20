import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { TOKEN_FUZZY } from "../../src/concepts/Querying/tokenFuzzy.ts";
import { createSticky } from "../sticky-app.ts";
import { openTestDb, type TestDb } from "../test-db.ts";

const mit = { latitude: 42.3601, longitude: -71.0942 };
const kendall = { latitude: 42.3626, longitude: -71.0862 };
const nyc = { latitude: 40.7128, longitude: -74.006 };

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

describe("Searching", () => {
  test("its principle: notes in range are ranked, edits update the documents, and deletes leave the search", async () => {
    const { browser, signIn } = createSticky(testDb.db);
    const maya = browser();
    const reader = browser();
    await signIn(maya, "maya");

    const killian = await maya["/posts/create"]({ body: "Killian grass is closed", location: mit });
    const stata = await maya["/posts/create"]({ body: "Stata's doors are open", location: mit });
    const far = await maya["/posts/create"]({ body: "Killian coffee in NYC", location: nyc });
    if ("error" in killian || "error" in stata || "error" in far) {
      throw new Error(JSON.stringify({ killian, stata, far }));
    }

    const opened = await reader["/search/open"]({ location: mit, miles: 1 });
    if ("error" in opened) throw new Error(JSON.stringify(opened));
    const { context } = opened;
    expect(await reader["/search/replace"]({ context, members: opened.members })).toEqual({ context });

    const ranked = await reader["/search/query"]({
      context,
      query: "killian grass",
      resultCount: 8,
      algorithm: TOKEN_FUZZY,
    });
    if ("error" in ranked) throw new Error(JSON.stringify(ranked));
    expect(ranked.notes.map((note) => note.post)).toEqual([killian.post]);
    expect(ranked.notes[0]).toMatchObject({
      post: killian.post,
      body: "Killian grass is closed",
      username: "maya",
      count: 0,
    });

    expect(await maya["/posts/edit"]({ post: stata.post, body: "Killian path by Stata" })).toEqual({ post: stata.post });
    const afterEdit = await reader["/search/query"]({
      context,
      query: "killian",
      resultCount: 8,
      algorithm: TOKEN_FUZZY,
    });
    if ("error" in afterEdit) throw new Error(JSON.stringify(afterEdit));
    expect(afterEdit.notes.map((note) => note.post)).toEqual(
      expect.arrayContaining([killian.post, stata.post]),
    );
    expect(afterEdit.notes).toHaveLength(2);

    expect(await maya["/posts/delete"]({ post: killian.post })).toEqual({ post: killian.post });
    const afterDelete = await reader["/search/query"]({
      context,
      query: "killian",
      resultCount: 8,
      algorithm: TOKEN_FUZZY,
    });
    if ("error" in afterDelete) throw new Error(JSON.stringify(afterDelete));
    expect(afterDelete.notes.map((note) => note.post)).toEqual([stata.post]);

    const synced = await reader["/search/sync"]({ context, location: mit, miles: 1 });
    if ("error" in synced) throw new Error(JSON.stringify(synced));
    expect(await reader["/search/replace"]({ context, members: synced.members })).toEqual({ context });
    const afterSync = await reader["/search/query"]({
      context,
      query: "killian",
      resultCount: 8,
      algorithm: TOKEN_FUZZY,
    });
    if ("error" in afterSync) throw new Error(JSON.stringify(afterSync));
    expect(afterSync.notes.map((note) => note.post)).toEqual([stata.post]);
    expect(afterSync.notes.map((note) => note.post)).not.toContain(far.post);

    expect(await reader["/search/close"]({ context })).toEqual({});
    expect(
      await reader["/search/query"]({
        context,
        query: "killian",
        resultCount: 8,
        algorithm: TOKEN_FUZZY,
      }),
    ).toEqual({ notes: [] });
  });

  test("opening a search does not require a session, and a note outside the radius is omitted", async () => {
    const { browser, signIn } = createSticky(testDb.db);
    const maya = browser();
    const reader = browser();
    await signIn(maya, "maya");
    const nearby = await maya["/posts/create"]({ body: "Kendall square lunch", location: kendall });
    const far = await maya["/posts/create"]({ body: "Kendall in NYC", location: nyc });
    if ("error" in nearby || "error" in far) throw new Error(JSON.stringify({ nearby, far }));

    const opened = await reader["/search/open"]({ location: mit, miles: 1 });
    if ("error" in opened) throw new Error(JSON.stringify(opened));
    expect(await reader["/search/replace"]({ context: opened.context, members: opened.members })).toEqual({
      context: opened.context,
    });
    const ranked = await reader["/search/query"]({
      context: opened.context,
      query: "kendall",
      resultCount: 8,
      algorithm: TOKEN_FUZZY,
    });
    if ("error" in ranked) throw new Error(JSON.stringify(ranked));
    expect(ranked.notes.map((note) => note.post)).toEqual([nearby.post]);
  });
});
