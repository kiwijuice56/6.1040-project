import { expect } from "bun:test";

/** From ConceptBox: exactly one of the attempts started together succeeds; the rest refuse. */
export async function expectOneWinner(attempts: Promise<unknown>[], refusal: new (message?: string) => Error) {
  const outcomes = await Promise.allSettled(attempts);
  expect(outcomes.filter((outcome) => outcome.status === "fulfilled")).toHaveLength(1);
  for (const outcome of outcomes) {
    if (outcome.status === "rejected") expect(outcome.reason).toBeInstanceOf(refusal);
  }
}
