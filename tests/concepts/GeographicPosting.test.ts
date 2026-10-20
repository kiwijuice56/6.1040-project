import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import {
  EmptyBody,
  GeographicPostingConcept,
  InvalidLocation,
  NotAuthor,
  PostNotFound,
  type Post,
} from "../../src/concepts/GeographicPosting/GeographicPosting.ts";
import { openTestDb, type TestDb } from "../test-db.ts";

const mit = { latitude: 42.3601, longitude: -71.0942 };
const kendall = { latitude: 42.3626, longitude: -71.0862 };

let testDb: TestDb;
let posting: GeographicPostingConcept<string>;

beforeAll(async () => {
  testDb = await openTestDb();
}, 120_000);

beforeEach(async () => {
  await testDb.db.dropDatabase();
  posting = new GeographicPostingConcept(testDb.db);
});

afterAll(async () => {
  await testDb.close();
});

describe("GeographicPosting", () => {
  test("its principle: Maya posts at a coordinate, edits the text, then deletes the post", async () => {
    const { post } = await posting.post({ user: "maya", body: "Hello from Killian Court", location: mit });
    expect(await posting._allPosts()).toEqual([
      { post, body: "Hello from Killian Court", author: "maya", location: mit },
    ]);

    expect(await posting.edit({ user: "maya", post, body: "Hello from the Dome" })).toEqual({ post });
    expect(await posting._allPosts()).toEqual([{ post, body: "Hello from the Dome", author: "maya", location: mit }]);

    expect(await posting.delete({ user: "maya", post })).toEqual({ post });
    expect(await posting._allPosts()).toEqual([]);
  });

  test("post returns a new post that _allPosts includes", async () => {
    const { post } = await posting.post({ user: "maya", body: "a note", location: mit });
    expect(post).toBeString();
    expect(await posting._allPosts()).toEqual([{ post, body: "a note", author: "maya", location: mit }]);
  });

  test("post accepts coordinates on the valid range edges", async () => {
    const south = await posting.post({
      user: "maya",
      body: "south",
      location: { latitude: -90, longitude: -180 },
    });
    const north = await posting.post({
      user: "sam",
      body: "north",
      location: { latitude: 90, longitude: 180 },
    });
    const rows = await posting._allPosts();
    expect(rows).toHaveLength(2);
    expect(rows).toEqual(
      expect.arrayContaining([
        { post: south.post, body: "south", author: "maya", location: { latitude: -90, longitude: -180 } },
        { post: north.post, body: "north", author: "sam", location: { latitude: 90, longitude: 180 } },
      ]),
    );
  });

  test("post refuses an empty body and stores nothing", async () => {
    const refusal = posting.post({ user: "maya", body: "", location: mit });
    await expect(refusal).rejects.toThrow(EmptyBody);
    await expect(refusal).rejects.toThrow("A post needs some text.");
    expect(await posting._allPosts()).toEqual([]);
  });

  test("post refuses a blank body and stores nothing", async () => {
    await expect(posting.post({ user: "maya", body: "   ", location: mit })).rejects.toThrow(EmptyBody);
    expect(await posting._allPosts()).toEqual([]);
  });

  test("post refuses an invalid coordinate and stores nothing", async () => {
    const refusal = posting.post({ user: "maya", body: "a note", location: { latitude: 91, longitude: 0 } });
    await expect(refusal).rejects.toThrow(InvalidLocation);
    await expect(refusal).rejects.toThrow("That location is not a valid GPS coordinate.");
    expect(await posting._allPosts()).toEqual([]);
  });

  test("post refuses a non-finite coordinate", async () => {
    await expect(
      posting.post({ user: "maya", body: "a note", location: { latitude: Number.NaN, longitude: 0 } }),
    ).rejects.toThrow(InvalidLocation);
    expect(await posting._allPosts()).toEqual([]);
  });

  test("edit overwrites the body and leaves the location", async () => {
    const { post } = await posting.post({ user: "maya", body: "first", location: mit });
    expect(await posting.edit({ user: "maya", post, body: "second" })).toEqual({ post });
    expect(await posting._allPosts()).toEqual([{ post, body: "second", author: "maya", location: mit }]);
  });

  test("edit refuses an unknown post", async () => {
    const post = crypto.randomUUID() as Post;
    const refusal = posting.edit({ user: "maya", post, body: "second" });
    await expect(refusal).rejects.toThrow(PostNotFound);
    await expect(refusal).rejects.toThrow("There is no such post.");
    expect(await posting._allPosts()).toEqual([]);
  });

  test("edit refuses a user who is not the author and leaves the post", async () => {
    const { post } = await posting.post({ user: "maya", body: "first", location: mit });
    const refusal = posting.edit({ user: "sam", post, body: "stolen" });
    await expect(refusal).rejects.toThrow(NotAuthor);
    await expect(refusal).rejects.toThrow("Only the author can change this post.");
    expect(await posting._allPosts()).toEqual([{ post, body: "first", author: "maya", location: mit }]);
  });

  test("edit refuses an empty body and leaves the post", async () => {
    const { post } = await posting.post({ user: "maya", body: "first", location: mit });
    const refusal = posting.edit({ user: "maya", post, body: "" });
    await expect(refusal).rejects.toThrow(EmptyBody);
    await expect(refusal).rejects.toThrow("A post needs some text.");
    expect(await posting._allPosts()).toEqual([{ post, body: "first", author: "maya", location: mit }]);
  });

  test("delete removes the author's post", async () => {
    const { post } = await posting.post({ user: "maya", body: "a note", location: mit });
    expect(await posting.delete({ user: "maya", post })).toEqual({ post });
    expect(await posting._allPosts()).toEqual([]);
  });

  test("delete refuses an unknown post", async () => {
    const { post } = await posting.post({ user: "maya", body: "a note", location: mit });
    const refusal = posting.delete({ user: "maya", post: crypto.randomUUID() as Post });
    await expect(refusal).rejects.toThrow(PostNotFound);
    await expect(refusal).rejects.toThrow("There is no such post.");
    expect(await posting._allPosts()).toEqual([{ post, body: "a note", author: "maya", location: mit }]);
  });

  test("delete refuses a user who is not the author and leaves the post", async () => {
    const { post } = await posting.post({ user: "maya", body: "a note", location: mit });
    const refusal = posting.delete({ user: "sam", post });
    await expect(refusal).rejects.toThrow(NotAuthor);
    await expect(refusal).rejects.toThrow("Only the author can change this post.");
    expect(await posting._allPosts()).toEqual([{ post, body: "a note", author: "maya", location: mit }]);
  });

  test("_post returns the post, or no row when it is unknown", async () => {
    expect(await posting._post({ post: crypto.randomUUID() as Post })).toEqual([]);
    const { post } = await posting.post({ user: "maya", body: "a note", location: mit });
    expect(await posting._post({ post })).toEqual([{ body: "a note", author: "maya", location: mit }]);
  });

  test("_postsNear returns posts inside the radius, or no rows", async () => {
    const maya = await posting.post({ user: "maya", body: "Killian", location: mit });
    const sam = await posting.post({ user: "sam", body: "Kendall", location: kendall });
    const far = await posting.post({
      user: "leo",
      body: "NYC",
      location: { latitude: 40.7128, longitude: -74.006 },
    });

    expect(await posting._postsNear({ location: mit, miles: 0 })).toEqual([]);
    expect(await posting._postsNear({ location: { latitude: 91, longitude: 0 }, miles: 1 })).toEqual([]);

    const close = await posting._postsNear({ location: mit, miles: 0.3 });
    expect(close).toEqual([{ post: maya.post, body: "Killian", author: "maya", location: mit }]);

    const nearby = await posting._postsNear({ location: mit, miles: 1 });
    expect(nearby).toEqual(
      expect.arrayContaining([
        { post: maya.post, body: "Killian", author: "maya", location: mit },
        { post: sam.post, body: "Kendall", author: "sam", location: kendall },
      ]),
    );
    expect(nearby).toHaveLength(2);
    expect(nearby.map((row) => row.post)).not.toContain(far.post);
  });

  test("_allPosts returns every post from every author, or no rows", async () => {
    expect(await posting._allPosts()).toEqual([]);
    const maya = await posting.post({ user: "maya", body: "Killian", location: mit });
    const sam = await posting.post({ user: "sam", body: "Kendall", location: kendall });
    expect(await posting._allPosts()).toEqual(
      expect.arrayContaining([
        { post: maya.post, body: "Killian", author: "maya", location: mit },
        { post: sam.post, body: "Kendall", author: "sam", location: kendall },
      ]),
    );
    expect(await posting._allPosts()).toHaveLength(2);
  });
});
