const ACCENTS = ["var(--accent-1)", "var(--accent-2)", "var(--accent-3)", "var(--accent-4)"] as const;

/**
 * Keyed by location rather than post id, because the composer needs the color before the server assigns an id.
 * The same spot always gets the same accent, so a note's card, map dot, and composer preview all match.
 */
export function accentFor(location: { latitude: number; longitude: number }): string {
  const key = `${location.latitude},${location.longitude}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
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
