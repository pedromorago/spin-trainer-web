// random.js — random choices with an injectable RNG (rng: () => number in [0,1)) for deterministic tests.

/** Uniform element of the list, or null if it is empty. */
export function pickUniform(items, rng = Math.random) {
  return items.length ? items[Math.floor(rng() * items.length)] : null;
}

/** Element with probability proportional to its weight; weights ≤ 0 never come out. null if there are no candidates. */
export function pickWeighted(items, weightOf, rng = Math.random) {
  const weighted = items.map(item => [item, Math.max(0, weightOf(item))]).filter(([, w]) => w > 0);
  const total = weighted.reduce((n, [, w]) => n + w, 0);
  if (total === 0) return null;
  let r = rng() * total;
  for (const [item, w] of weighted) {
    if (r < w) return item;
    r -= w;
  }
  return weighted.at(-1)[0];
}
