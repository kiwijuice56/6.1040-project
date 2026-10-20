/** Sticky's inexpensive SearchAlgorithm: bag-of-words with prefix and small-edit matches. */
export const TOKEN_FUZZY = "tokenFuzzy";

const TOKEN = /[a-z0-9]+/g;
const STOP = new Set(["a", "an", "the", "to", "of", "in", "on", "at", "for", "and", "or"]);

export function tokens(text: string): string[] {
  return (text.toLowerCase().match(TOKEN) ?? []).filter((token) => !STOP.has(token));
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let next = new Array<number>(b.length + 1);
  for (let i = 0; i < a.length; i++) {
    next[0] = i + 1;
    for (let j = 0; j < b.length; j++) {
      const cost = a[i] === b[j] ? 0 : 1;
      next[j + 1] = Math.min(prev[j + 1] + 1, next[j] + 1, prev[j] + cost);
    }
    [prev, next] = [next, prev];
  }
  return prev[b.length];
}

function tokenScore(query: string, documentTokens: readonly string[]): number {
  let best = 0;
  for (const word of documentTokens) {
    if (word === query) return 3;
    if (query.length >= 2 && (word.startsWith(query) || query.startsWith(word))) {
      best = Math.max(best, 2);
      continue;
    }
    const maxDist = query.length >= 5 ? 2 : 1;
    if (query.length >= 2 && Math.abs(word.length - query.length) <= maxDist && levenshtein(query, word) <= maxDist) {
      best = Math.max(best, 1);
    }
  }
  return best;
}

/** Higher is a better match. Zero means omit the document. */
export function scoreDocument(query: string, document: string): number {
  const queryTokens = tokens(query);
  if (queryTokens.length === 0) return 0;
  const documentTokens = tokens(document);
  let total = 0;
  let hits = 0;
  for (const word of queryTokens) {
    const score = tokenScore(word, documentTokens);
    if (score > 0) hits += 1;
    total += score;
  }
  if (hits === 0) return 0;
  return total + hits / (queryTokens.length + 1);
}
