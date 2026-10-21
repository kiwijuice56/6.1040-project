import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import {
  AlreadyIndexed,
  ContextNotFound,
  InvalidBundle,
  NotIndexed,
  QueryingConcept,
} from "../../src/concepts/Querying/Querying.ts";
import { TOKEN_FUZZY } from "../../src/concepts/Querying/tokenFuzzy.ts";
import { openTestDb, type TestDb } from "../test-db.ts";

let testDb: TestDb;
let querying: QueryingConcept<string>;

beforeAll(async () => {
  testDb = await openTestDb();
}, 120_000);

beforeEach(async () => {
  await testDb.db.dropDatabase();
  querying = new QueryingConcept(testDb.db);
});

afterAll(async () => {
  await testDb.close();
});

describe("Querying", () => {
  test("its principle: index notes, then rank the ones whose documents match the query", async () => {
    const { context } = await querying.createContext();
    await querying.index({ context, resource: "killian", document: "Killian grass is closed" });
    await querying.index({ context, resource: "stata", document: "Stata's doors are open" });

    const rows = await querying._getNResults({
      context,
      algorithm: TOKEN_FUZZY,
      query: "killian grass",
      resultCount: 5,
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.resource).toBe("killian");
    expect(rows[0]?.rank).toBeGreaterThan(0);
  });

  test("createContext returns a new context each time", async () => {
    const first = await querying.createContext();
    const second = await querying.createContext();
    expect(first.context).toBeString();
    expect(second.context).toBeString();
    expect(first.context).not.toBe(second.context);
  });

  test("index refuses an unknown context and stores nothing", async () => {
    const context = crypto.randomUUID() as Awaited<ReturnType<QueryingConcept<string>["createContext"]>>["context"];
    const refusal = querying.index({ context, resource: "note", document: "hello" });
    await expect(refusal).rejects.toThrow(ContextNotFound);
    await expect(refusal).rejects.toThrow("There is no such search.");
  });

  test("index refuses a resource already in the context", async () => {
    const { context } = await querying.createContext();
    await querying.index({ context, resource: "note", document: "hello" });
    const refusal = querying.index({ context, resource: "note", document: "again" });
    await expect(refusal).rejects.toThrow(AlreadyIndexed);
    expect(await querying._indexed({ context })).toEqual([{ resource: "note", document: "hello" }]);
  });

  test("unindex removes a resource from one context", async () => {
    const { context } = await querying.createContext();
    await querying.index({ context, resource: "note", document: "hello" });
    expect(await querying.unindex({ context, resource: "note" })).toEqual({ resource: "note" });
    expect(await querying._indexed({ context })).toEqual([]);
  });

  test("unindex refuses an unknown context or a resource that is not indexed", async () => {
    const missing = crypto.randomUUID() as Awaited<ReturnType<QueryingConcept<string>["createContext"]>>["context"];
    await expect(querying.unindex({ context: missing, resource: "note" })).rejects.toThrow(ContextNotFound);

    const { context } = await querying.createContext();
    const refusal = querying.unindex({ context, resource: "note" });
    await expect(refusal).rejects.toThrow(NotIndexed);
    await expect(refusal).rejects.toThrow("That resource is not in this search.");
  });

  test("replace loads a bundle and overwrites previous members", async () => {
    const { context } = await querying.createContext();
    await querying.index({ context, resource: "old", document: "old text" });
    expect(
      await querying.replace({
        context,
        bundle: [
          { resource: "killian", document: "Killian grass" },
          { resource: "stata", document: "Stata doors" },
        ],
      }),
    ).toEqual({ context });
    expect(await querying._indexed({ context })).toEqual(
      expect.arrayContaining([
        { resource: "killian", document: "Killian grass" },
        { resource: "stata", document: "Stata doors" },
      ]),
    );
    expect(await querying._indexed({ context })).toHaveLength(2);
  });

  test("replace refuses a malformed bundle and leaves the index", async () => {
    const { context } = await querying.createContext();
    await querying.index({ context, resource: "note", document: "hello" });
    const refusal = querying.replace({ context, bundle: { members: "nope" } as never });
    await expect(refusal).rejects.toThrow(InvalidBundle);
    expect(await querying._indexed({ context })).toEqual([{ resource: "note", document: "hello" }]);
  });

  test("discard removes the context so later ranking returns no rows", async () => {
    const { context } = await querying.createContext();
    await querying.index({ context, resource: "note", document: "Killian grass" });
    expect(await querying.discard({ context })).toEqual({ context });
    expect(
      await querying._getNResults({ context, algorithm: TOKEN_FUZZY, query: "killian", resultCount: 5 }),
    ).toEqual([]);
    await expect(querying.discard({ context })).rejects.toThrow(ContextNotFound);
  });

  test("unindexEverywhere and reindexEverywhere update every context that has the resource", async () => {
    const first = await querying.createContext();
    const second = await querying.createContext();
    await querying.index({ context: first.context, resource: "note", document: "old" });
    await querying.index({ context: second.context, resource: "note", document: "old" });
    await querying.index({ context: second.context, resource: "other", document: "keep" });

    expect(await querying.reindexEverywhere({ resource: "note", document: "new body" })).toEqual({ resource: "note" });
    expect(await querying._indexed({ context: first.context })).toEqual([{ resource: "note", document: "new body" }]);
    expect(await querying._indexed({ context: second.context })).toEqual(
      expect.arrayContaining([
        { resource: "note", document: "new body" },
        { resource: "other", document: "keep" },
      ]),
    );

    expect(await querying.unindexEverywhere({ resource: "note" })).toEqual({ resource: "note" });
    expect(await querying._indexed({ context: first.context })).toEqual([]);
    expect(await querying._indexed({ context: second.context })).toEqual([{ resource: "other", document: "keep" }]);
  });

  test("_getNResults prefers exact matches, then prefixes, then typos, and omits non-matches", async () => {
    const { context } = await querying.createContext();
    await querying.replace({
      context,
      bundle: [
        { resource: "exact", document: "coffee on Killian Court" },
        { resource: "typo", document: "cofee stand by the dome" },
        { resource: "other", document: "Stata doors" },
      ],
    });

    const rows = await querying._getNResults({
      context,
      algorithm: TOKEN_FUZZY,
      query: "coffee",
      resultCount: 5,
    });
    expect(rows.map((row) => row.resource)).toEqual(["exact", "typo"]);
    expect(rows[0]?.rank).toBeGreaterThan(rows[1]?.rank ?? 0);
  });

  test("replace on an unknown context stores nothing and leaves other contexts", async () => {
    const kept = await querying.createContext();
    await querying.index({ context: kept.context, resource: "keep", document: "stay" });
    const missing = crypto.randomUUID() as typeof kept.context;
    const refusal = querying.replace({ context: missing, bundle: [{ resource: "note", document: "hello" }] });
    await expect(refusal).rejects.toThrow(ContextNotFound);
    await expect(refusal).rejects.toThrow("There is no such search.");
    expect(await querying._context({ context: missing })).toEqual([]);
    expect(await querying._indexed({ context: missing })).toEqual([]);
    expect(await querying._indexed({ context: kept.context })).toEqual([{ resource: "keep", document: "stay" }]);
  });

  test("replace with an empty bundle clears the context, and a repeated resource keeps the first document", async () => {
    const { context } = await querying.createContext();
    await querying.index({ context, resource: "old", document: "old text" });
    expect(
      await querying.replace({
        context,
        bundle: [
          { resource: "note", document: "first" },
          { resource: "note", document: "second" },
        ],
      }),
    ).toEqual({ context });
    expect(await querying._indexed({ context })).toEqual([{ resource: "note", document: "first" }]);

    expect(await querying.replace({ context, bundle: [] })).toEqual({ context });
    expect(await querying._indexed({ context })).toEqual([]);
    expect(
      await querying._getNResults({ context, algorithm: TOKEN_FUZZY, query: "first", resultCount: 5 }),
    ).toEqual([]);
  });

  test("_context returns the context, or no row when it is unknown", async () => {
    const missing = crypto.randomUUID() as Awaited<ReturnType<QueryingConcept<string>["createContext"]>>["context"];
    expect(await querying._context({ context: missing })).toEqual([]);
    const { context } = await querying.createContext();
    expect(await querying._context({ context })).toEqual([{ context }]);
  });

  test("_getNResults ranks a prefix below an exact token and returns at most resultCount rows", async () => {
    const { context } = await querying.createContext();
    await querying.replace({
      context,
      bundle: [
        { resource: "exact", document: "kil marker by the dome" },
        { resource: "prefix", document: "killian court is closed" },
        { resource: "other", document: "stata doors" },
      ],
    });

    const rows = await querying._getNResults({
      context,
      algorithm: TOKEN_FUZZY,
      query: "kil",
      resultCount: 5,
    });
    expect(rows.map((row) => row.resource)).toEqual(["exact", "prefix"]);
    expect(rows[0]?.rank).toBeGreaterThan(rows[1]?.rank ?? 0);

    const capped = await querying._getNResults({
      context,
      algorithm: TOKEN_FUZZY,
      query: "kil",
      resultCount: 1,
    });
    expect(capped.map((row) => row.resource)).toEqual(["exact"]);
  });

  test("_getNResults returns no rows for an unknown algorithm, empty query, or non-positive count", async () => {
    const { context } = await querying.createContext();
    await querying.index({ context, resource: "note", document: "Killian grass" });
    expect(
      await querying._getNResults({ context, algorithm: "other", query: "killian", resultCount: 5 }),
    ).toEqual([]);
    expect(
      await querying._getNResults({ context, algorithm: TOKEN_FUZZY, query: "   ", resultCount: 5 }),
    ).toEqual([]);
    expect(
      await querying._getNResults({ context, algorithm: TOKEN_FUZZY, query: "killian", resultCount: 0 }),
    ).toEqual([]);
  });
});
