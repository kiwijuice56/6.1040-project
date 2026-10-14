import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { AlreadyVoted, NoVote, UpvotingConcept } from "../../src/concepts/Upvoting/Upvoting.ts";
import { openTestDb, type TestDb } from "../test-db.ts";

let testDb: TestDb;
let voting: UpvotingConcept<string, string>;

beforeAll(async () => {
  testDb = await openTestDb();
}, 120_000);

beforeEach(async () => {
  await testDb.db.dropDatabase();
  voting = new UpvotingConcept(testDb.db);
});

afterAll(async () => {
  await testDb.close();
});

describe("Upvoting", () => {
  test("its principle: Sam upvotes, Leo downvotes, Sam unvotes, then the votes are cleared", async () => {
    const note = "maya-note";
    expect(await voting.upvote({ voter: "sam", resource: note })).toEqual({ resource: note });
    expect(await voting._getVoteCount({ resource: note })).toEqual({ count: 1 });

    expect(await voting.downvote({ voter: "leo", resource: note })).toEqual({ resource: note });
    expect(await voting._getVoteCount({ resource: note })).toEqual({ count: 0 });

    expect(await voting.unvote({ voter: "sam", resource: note })).toEqual({ resource: note });
    expect(await voting._getVoteCount({ resource: note })).toEqual({ count: -1 });

    expect(await voting.clearAllVotes({ resource: note })).toEqual({ resource: note });
    expect(await voting._getVoteCount({ resource: note })).toEqual({ count: 0 });
  });

  test("upvote then downvote by another voter nets the two votes", async () => {
    await voting.upvote({ voter: "sam", resource: "note" });
    await voting.upvote({ voter: "maya", resource: "note" });
    await voting.downvote({ voter: "leo", resource: "note" });
    expect(await voting._getVoteCount({ resource: "note" })).toEqual({ count: 1 });
  });

  test("votes on one resource do not change the count of another", async () => {
    await voting.upvote({ voter: "sam", resource: "note-a" });
    await voting.downvote({ voter: "sam", resource: "note-b" });
    expect(await voting._getVoteCount({ resource: "note-a" })).toEqual({ count: 1 });
    expect(await voting._getVoteCount({ resource: "note-b" })).toEqual({ count: -1 });
  });

  test("upvote refuses a second vote by the same voter and leaves the count", async () => {
    await voting.upvote({ voter: "sam", resource: "note" });
    const refusal = voting.upvote({ voter: "sam", resource: "note" });
    await expect(refusal).rejects.toThrow(AlreadyVoted);
    await expect(refusal).rejects.toThrow("You already have a vote on this.");
    expect(await voting._getVoteCount({ resource: "note" })).toEqual({ count: 1 });
  });

  test("downvote refuses when the voter already upvoted", async () => {
    await voting.upvote({ voter: "sam", resource: "note" });
    const refusal = voting.downvote({ voter: "sam", resource: "note" });
    await expect(refusal).rejects.toThrow(AlreadyVoted);
    expect(await voting._getVoteCount({ resource: "note" })).toEqual({ count: 1 });
  });

  test("upvote refuses when the voter already downvoted", async () => {
    await voting.downvote({ voter: "sam", resource: "note" });
    const refusal = voting.upvote({ voter: "sam", resource: "note" });
    await expect(refusal).rejects.toThrow(AlreadyVoted);
    expect(await voting._getVoteCount({ resource: "note" })).toEqual({ count: -1 });
  });

  test("unvote refuses when the voter has no vote", async () => {
    const refusal = voting.unvote({ voter: "sam", resource: "note" });
    await expect(refusal).rejects.toThrow(NoVote);
    await expect(refusal).rejects.toThrow("You have not voted on this.");
    expect(await voting._getVoteCount({ resource: "note" })).toEqual({ count: 0 });
  });

  test("clearAllVotes succeeds when there are no votes", async () => {
    expect(await voting.clearAllVotes({ resource: "note" })).toEqual({ resource: "note" });
    expect(await voting._getVoteCount({ resource: "note" })).toEqual({ count: 0 });
  });

  test("_getVoteCount is 0 when nobody has voted", async () => {
    expect(await voting._getVoteCount({ resource: "note" })).toEqual({ count: 0 });
  });

  test("_getVote returns the voter's flag, or no row", async () => {
    expect(await voting._getVote({ voter: "sam", resource: "note" })).toEqual([]);
    await voting.upvote({ voter: "sam", resource: "note" });
    expect(await voting._getVote({ voter: "sam", resource: "note" })).toEqual([{ upvote: true }]);
    await voting.unvote({ voter: "sam", resource: "note" });
    await voting.downvote({ voter: "sam", resource: "note" });
    expect(await voting._getVote({ voter: "sam", resource: "note" })).toEqual([{ upvote: false }]);
    expect(await voting._getVote({ voter: "leo", resource: "note" })).toEqual([]);
  });
});
