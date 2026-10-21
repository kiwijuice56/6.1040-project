import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import {
  AlreadyLabeled,
  LabelingConcept,
  LabelNotFound,
  NotLabeled,
  type Label,
} from "../../src/concepts/Labeling/Labeling.ts";
import { openTestDb, type TestDb } from "../test-db.ts";

let testDb: TestDb;
let labeling: LabelingConcept<string>;

beforeAll(async () => {
  testDb = await openTestDb();
}, 120_000);

beforeEach(async () => {
  await testDb.db.dropDatabase();
  labeling = new LabelingConcept(testDb.db);
});

afterAll(async () => {
  await testDb.close();
});

function unknownLabel() {
  return crypto.randomUUID() as Label;
}

describe("Labeling", () => {
  test("its principle: apply two resources, read them, remove one, then the group has the other", async () => {
    const { label } = await labeling.createLabel();
    await labeling.applyLabel({ label, resource: "killian" });
    await labeling.applyLabel({ label, resource: "stata" });

    expect(await labeling._resources({ label })).toEqual([{ resource: "killian" }, { resource: "stata" }]);
    expect(await labeling._has({ label, resource: "killian" })).toEqual([{ resource: "killian" }]);

    expect(await labeling.removeLabel({ label, resource: "stata" })).toEqual({ resource: "stata" });
    expect(await labeling._resources({ label })).toEqual([{ resource: "killian" }]);
    expect(await labeling._has({ label, resource: "stata" })).toEqual([]);
  });

  test("ensure creates a chosen label once, then applyLabel can use it", async () => {
    const label = "maya" as Label;
    expect(await labeling.ensure({ label })).toEqual({ label });
    expect(await labeling.ensure({ label })).toEqual({ label });
    expect(await labeling._label({ label })).toEqual([{ label }]);
    await labeling.applyLabel({ label, resource: "killian" });
    expect(await labeling._resources({ label })).toEqual([{ resource: "killian" }]);
  });

  test("createLabel returns a new label each time", async () => {
    const first = await labeling.createLabel();
    const second = await labeling.createLabel();
    expect(first.label).toBeString();
    expect(second.label).toBeString();
    expect(first.label).not.toBe(second.label);
    expect(await labeling._label({ label: first.label })).toEqual([{ label: first.label }]);
  });

  test("the same resource can belong to many labels", async () => {
    const saved = await labeling.createLabel();
    const place = await labeling.createLabel();
    await labeling.applyLabel({ label: saved.label, resource: "killian" });
    await labeling.applyLabel({ label: place.label, resource: "killian" });
    await labeling.applyLabel({ label: place.label, resource: "stata" });

    expect(await labeling._resources({ label: saved.label })).toEqual([{ resource: "killian" }]);
    expect(await labeling._resources({ label: place.label })).toEqual([{ resource: "killian" }, { resource: "stata" }]);
    expect(await labeling._labels({ resource: "killian" })).toEqual([{ label: saved.label }, { label: place.label }]);
  });

  test("applyLabel refuses an unknown label and stores nothing", async () => {
    const label = unknownLabel();
    const refusal = labeling.applyLabel({ label, resource: "killian" });
    await expect(refusal).rejects.toThrow(LabelNotFound);
    await expect(refusal).rejects.toThrow("There is no such label.");
    expect(await labeling._resources({ label })).toEqual([]);
    expect(await labeling._labels({ resource: "killian" })).toEqual([]);
  });

  test("applyLabel refuses a resource already in the label", async () => {
    const { label } = await labeling.createLabel();
    await labeling.applyLabel({ label, resource: "killian" });
    const refusal = labeling.applyLabel({ label, resource: "killian" });
    await expect(refusal).rejects.toThrow(AlreadyLabeled);
    await expect(refusal).rejects.toThrow("That resource already has this label.");
    expect(await labeling._resources({ label })).toEqual([{ resource: "killian" }]);
  });

  test("removeLabel refuses an unknown label or a resource that is not a member", async () => {
    const missing = unknownLabel();
    await expect(labeling.removeLabel({ label: missing, resource: "killian" })).rejects.toThrow(LabelNotFound);

    const { label } = await labeling.createLabel();
    const refusal = labeling.removeLabel({ label, resource: "killian" });
    await expect(refusal).rejects.toThrow(NotLabeled);
    await expect(refusal).rejects.toThrow("That resource does not have this label.");
  });

  test("delete removes the label and its memberships; other labels keep theirs", async () => {
    const first = await labeling.createLabel();
    const second = await labeling.createLabel();
    await labeling.applyLabel({ label: first.label, resource: "killian" });
    await labeling.applyLabel({ label: second.label, resource: "killian" });
    await labeling.applyLabel({ label: second.label, resource: "stata" });

    expect(await labeling.delete({ label: first.label })).toEqual({ label: first.label });
    expect(await labeling._label({ label: first.label })).toEqual([]);
    expect(await labeling._resources({ label: first.label })).toEqual([]);
    expect(await labeling._labels({ resource: "killian" })).toEqual([{ label: second.label }]);
    expect(await labeling._resources({ label: second.label })).toEqual([
      { resource: "killian" },
      { resource: "stata" },
    ]);
  });

  test("delete refuses an unknown label", async () => {
    const label = unknownLabel();
    const refusal = labeling.delete({ label });
    await expect(refusal).rejects.toThrow(LabelNotFound);
    await expect(refusal).rejects.toThrow("There is no such label.");
  });

  test("unlabelEverywhere removes the resource from every label", async () => {
    const first = await labeling.createLabel();
    const second = await labeling.createLabel();
    await labeling.applyLabel({ label: first.label, resource: "killian" });
    await labeling.applyLabel({ label: second.label, resource: "killian" });
    await labeling.applyLabel({ label: second.label, resource: "stata" });

    expect(await labeling.unlabelEverywhere({ resource: "killian" })).toEqual({ resource: "killian" });
    expect(await labeling._resources({ label: first.label })).toEqual([]);
    expect(await labeling._resources({ label: second.label })).toEqual([{ resource: "stata" }]);
    expect(await labeling._labels({ resource: "killian" })).toEqual([]);
    expect(await labeling._has({ label: first.label, resource: "killian" })).toEqual([]);
  });

  test("unlabelEverywhere succeeds when the resource is on no label", async () => {
    expect(await labeling.unlabelEverywhere({ resource: "killian" })).toEqual({ resource: "killian" });
  });

  test("_resources and _has are empty for an unknown or empty label", async () => {
    const missing = unknownLabel();
    expect(await labeling._resources({ label: missing })).toEqual([]);
    expect(await labeling._has({ label: missing, resource: "killian" })).toEqual([]);
    expect(await labeling._label({ label: missing })).toEqual([]);

    const { label } = await labeling.createLabel();
    expect(await labeling._resources({ label })).toEqual([]);
    expect(await labeling._has({ label, resource: "killian" })).toEqual([]);
    expect(await labeling._labels({ resource: "killian" })).toEqual([]);
  });
});
