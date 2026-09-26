// selection.js — selección de (situación, stack) sobre el catálogo, incluida la opción "Any" (aleatoria).
// Una combinación es { situation: key, stack: number }.

export const ANY = 'any';
export const DEFAULT_SITUATION = 'btn_open';

export const comboKey = ({ situation, stack }) => `${situation}@${stack}`;

/** Stacks ofrecidos: los de la situación, o la unión de todos (orden descendente) si la situación es ANY. */
export function stackOptions(catalog, situationKey) {
  if (situationKey === ANY) {
    return [...new Set(catalog.flatMap(s => s.stacks))].sort((a, b) => b - a);
  }
  return catalog.find(s => s.key === situationKey)?.stacks ?? [];
}

/**
 * Normaliza una selección pedida (p. ej. leída de la URL, strings incluidos) contra el catálogo.
 * Situación desconocida → default; stack no ofrecido → ANY si la situación es ANY, si no el primero de la situación.
 * @returns {{ situationKey: string, stack: number|string } | null} null si el catálogo está vacío
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

/** Combinaciones del catálogo compatibles con una selección (ANY en situación y/o stack). */
export function matchingCombos(catalog, { situationKey, stack }) {
  return catalog
    .filter(s => situationKey === ANY || s.key === situationKey)
    .flatMap(s => s.stacks.filter(st => stack === ANY || st === stack).map(st => ({ situation: s.key, stack: st })));
}

/** Combinación al azar (RNG inyectable); evita repetir `exclude` si hay alternativa. null si no hay combinaciones. */
export function pickCombo(combos, rng = Math.random, exclude = null) {
  const excluded = exclude ? comboKey(exclude) : null;
  const candidates = combos.length > 1 && excluded ? combos.filter(c => comboKey(c) !== excluded) : combos;
  return candidates.length ? candidates[Math.floor(rng() * candidates.length)] : null;
}
