const ACCENTS = ["var(--accent-1)", "var(--accent-2)", "var(--accent-3)", "var(--accent-4)"] as const;

/** The same post always gets the same accent, so its card and its map dot match. */
export function accentFor(post: string): string {
  let hash = 0;
  for (let i = 0; i < post.length; i++) hash = (hash * 31 + post.charCodeAt(i)) | 0;
  return ACCENTS[Math.abs(hash) % ACCENTS.length]!;
}
