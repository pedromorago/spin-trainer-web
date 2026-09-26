// selection.js — selection of (situation, stack) over the catalog, including the "Any" (random) option.
// A combination is { situation: key, stack: number }.

export const ANY = 'any';
export const DEFAULT_SITUATION = 'btn_open';

export const comboKey = ({ situation, stack }) => `${situation}@${stack}`;

/** Offered stacks: those of the situation, or the union of all of them (descending order) if the situation is ANY. */
export function stackOptions(catalog, situationKey) {
  if (situationKey === ANY) {
    return [...new Set(catalog.flatMap(s => s.stacks))].sort((a, b) => b - a);
  }
  return catalog.find(s => s.key === situationKey)?.stacks ?? [];
}

/**
 * Normalizes a requested selection (e.g. read from the URL, strings included) against the catalog.
 * Unknown situation → default; stack not offered → ANY if the situation is ANY, otherwise the first one of the situation.
 * @returns {{ situationKey: string, stack: number|string } | null} null if the catalog is empty
 */
export function resolveSelection(catalog, { situation, stack } = {}) {
  if (catalog.length === 0) return null;
  const situationKey = situation === ANY || catalog.some(s => s.key === situation)
    ? situation
    : (catalog.some(s => s.key === DEFAULT_SITUATION) ? DEFAULT_SITUATION : catalog[0].key);
  const options = stackOptions(catalog, situationKey);
  const requested = stack === ANY ? ANY : Number(stack);
  const resolvedStack = requested === ANY || options.includes(requested)
    ? requested
    : (situationKey === ANY ? ANY : options[0]);
  return { situationKey, stack: resolvedStack };
}

/** Catalog combinations compatible with a selection (ANY in situation and/or stack). */
export function matchingCombos(catalog, { situationKey, stack }) {
  return catalog
    .filter(s => situationKey === ANY || s.key === situationKey)
    .flatMap(s => s.stacks.filter(st => stack === ANY || st === stack).map(st => ({ situation: s.key, stack: st })));
}

/** Random combination (injectable RNG); avoids repeating `exclude` if there is an alternative. null if there are no combinations. */
export function pickCombo(combos, rng = Math.random, exclude = null) {
  const excluded = exclude ? comboKey(exclude) : null;
  const candidates = combos.length > 1 && excluded ? combos.filter(c => comboKey(c) !== excluded) : combos;
  return candidates.length ? candidates[Math.floor(rng() * candidates.length)] : null;
}
