const ACCENTS = ["var(--accent-1)", "var(--accent-2)", "var(--accent-3)", "var(--accent-4)"] as const;

/** The same post always gets the same accent, so its card and its map dot match. */
export function accentFor(post: string): string {
  let hash = 0;
  for (let i = 0; i < post.length; i++) hash = (hash * 31 + post.charCodeAt(i)) | 0;
  return ACCENTS[Math.abs(hash) % ACCENTS.length]!;
}

/** Random accent per letter: every accent appears at least once and neighbors never match. Needs count >= 4. */
export function logoAccents(count: number): string[] {
  const pick = () => ACCENTS[Math.floor(Math.random() * ACCENTS.length)]!;
  for (;;) {
    const colors = [...ACCENTS, ...Array.from({ length: count - ACCENTS.length }, pick)];
    for (let i = colors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [colors[i], colors[j]] = [colors[j]!, colors[i]!];
    }
    if (colors.every((color, i) => i === 0 || color !== colors[i - 1])) return colors;
  }
}
