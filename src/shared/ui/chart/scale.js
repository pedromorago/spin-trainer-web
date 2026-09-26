// Pure chart utilities (presentation): linear scales and "round" ticks.

/** Linear scale from the domain [d0, d1] to the range [r0, r1]. Degenerate domain → center of the range. */
export function linearScale([d0, d1], [r0, r1]) {
  const span = d1 - d0;
  return v => (span === 0 ? (r0 + r1) / 2 : r0 + ((v - d0) / span) * (r1 - r0));
}

/** "Round" maximum (1, 2, 5 × 10^k) ≥ n, for the value axis. n ≤ 0 → 1. */
export function niceMax(n) {
  if (!(n > 0)) return 1;
  const pow = 10 ** Math.floor(Math.log10(n));
  const step = [1, 2, 5, 10].find(m => m * pow >= n);
  return step * pow;
}

/**
 * Indices of the X-axis labels with a uniform integer step (never two adjacent labels due to rounding),
 * at most `max`; the last one is always labeled and replaces the previous one if it would be half a step away or less.
 */
export function labelIndices(count, max) {
  if (count <= 0) return [];
  if (count <= max) return Array.from({ length: count }, (_, i) => i);
  const step = Math.ceil((count - 1) / (max - 1));
  const indices = [];
  for (let i = 0; i < count; i += step) indices.push(i);
  const last = count - 1;
  if (indices.at(-1) !== last) {
    if (last - indices.at(-1) <= step / 2) indices.pop();
    indices.push(last);
  }
  return indices;
}
