// random.js — elecciones aleatorias con RNG inyectable (rng: () => número en [0,1)) para tests deterministas.

/** Elemento uniforme de la lista, o null si está vacía. */
export function pickUniform(items, rng = Math.random) {
  return items.length ? items[Math.floor(rng() * items.length)] : null;
}

/** Elemento con probabilidad proporcional a su peso; los pesos ≤ 0 nunca salen. null si no hay candidatos. */
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
