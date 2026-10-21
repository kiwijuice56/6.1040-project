import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { createSticky } from "../sticky-app.ts";
import { openTestDb, type TestDb } from "../test-db.ts";

const mit = { latitude: 42.3601, longitude: -71.0942 };
const stata = { latitude: 42.3616, longitude: -71.0906 };

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

describe("Saving", () => {
  test("its principle: a posted note is saved under the username label, can be unsaved, and saving another note lists both", async () => {
    const { browser, signIn } = createSticky(testDb.db);
    const maya = browser();
    await signIn(maya, "maya");

    const own = await maya["/posts/create"]({ body: "Killian grass is closed", location: mit });
    if ("error" in own) throw new Error(JSON.stringify(own));
    expect(await maya["/saves/list"]()).toEqual({
      notes: [
        {
          post: own.post,
          body: "Killian grass is closed",
          author: expect.any(String),
          location: mit,
          username: "maya",
          count: 0,
        },
      ],
    });

    expect(await maya["/saves/unsave"]({ post: own.post })).toEqual({ post: own.post });
    expect(await maya["/saves/list"]()).toEqual({ notes: [] });

    expect(await maya["/saves/save"]({ post: own.post })).toEqual({ post: own.post });
    const other = await maya["/posts/create"]({ body: "Stata's doors are open", location: stata });
    if ("error" in other) throw new Error(JSON.stringify(other));
    const listed = await maya["/saves/list"]();
    if ("error" in listed) throw new Error(JSON.stringify(listed));
    expect(listed.notes.map((note) => note.post)).toEqual([own.post, other.post]);
  });

  test("Maya can save Sam's note, and her list does not include Sam's own pile", async () => {
    const { browser, signIn } = createSticky(testDb.db);
    const maya = browser();
    const sam = browser();
    await signIn(maya, "maya");
    await signIn(sam, "sam");

    const created = await sam["/posts/create"]({ body: "Don't walk here", location: mit });
    if ("error" in created) throw new Error(JSON.stringify(created));
    const { post } = created;

    expect(await maya["/saves/list"]()).toEqual({ notes: [] });
    expect(await maya["/saves/save"]({ post })).toEqual({ post });
    const mayaList = await maya["/saves/list"]();
    if ("error" in mayaList) throw new Error(JSON.stringify(mayaList));
    expect(mayaList.notes.map((note) => note.post)).toEqual([post]);

    const samList = await sam["/saves/list"]();
    if ("error" in samList) throw new Error(JSON.stringify(samList));
    expect(samList.notes.map((note) => note.post)).toEqual([post]);
  });

  test("someone who is not signed in cannot save, unsave, or list", async () => {
    const { browser, signIn } = createSticky(testDb.db);
    const maya = browser();
    const anonymous = browser();
    await signIn(maya, "maya");
    const created = await maya["/posts/create"]({ body: "Killian grass", location: mit });
    if ("error" in created) throw new Error(JSON.stringify(created));

    expect(await anonymous["/saves/save"]({ post: created.post })).toEqual({ error: "UNAUTHORIZED" });
    expect(await anonymous["/saves/unsave"]({ post: created.post })).toEqual({ error: "UNAUTHORIZED" });
    expect(await anonymous["/saves/list"]()).toEqual({ error: "UNAUTHORIZED" });
  });

  test("saving twice is refused, unsaving twice is refused, and a delete leaves the list", async () => {
    const { browser, signIn } = createSticky(testDb.db);
    const maya = browser();
    await signIn(maya, "maya");
    const created = await maya["/posts/create"]({ body: "Stata doors", location: mit });
    if ("error" in created) throw new Error(JSON.stringify(created));
    const { post } = created;

    expect(await maya["/saves/save"]({ post })).toEqual({ error: "CONFLICT" });
    expect(await maya["/saves/unsave"]({ post })).toEqual({ post });
    expect(await maya["/saves/unsave"]({ post })).toEqual({ error: "NOT_FOUND" });

    expect(await maya["/saves/save"]({ post })).toEqual({ post });
    expect(await maya["/posts/delete"]({ post })).toEqual({ post });
    expect(await maya["/saves/list"]()).toEqual({ notes: [] });
  });
});
