// range.js — un rango es { [hand]: action }. Funciones puras compartidas por Explorer, Quiz y Builder.
import { allHands, combos, compareHands, getCell, getHand, isValidHand, TOTAL_COMBOS } from './hand';
import { ACTION_LABELS, fallbackAction, isValidAction } from './actions';

/** Pincel "goma": devuelve la mano a la acción implícita. */
export const ERASE = 'ERASE';

/**
 * Normaliza un rango: elimina manos inválidas o con acción no permitida en la situación,
 * y descarta la acción implícita (no se almacena).
 */
export function normalizeRange(hands, situationActions) {
  const implicit = fallbackAction(situationActions);
  const out = {};
  for (const [hand, action] of Object.entries(hands ?? {})) {
    if (!isValidHand(hand)) continue;
    if (!isValidAction(action, situationActions)) continue;
    if (action === implicit) continue;
    out[hand] = action;
  }
  return out;
}

/** Acción efectiva de una mano (explícita o implícita). */
export function actionFor(hands, hand, situationActions) {
  return hands?.[hand] ?? fallbackAction(situationActions);
}

/**
 * Pinta una mano con el pincel (una acción de la situación) o la borra (ERASE o la acción implícita).
 * Fija, no alterna: repetir el trazo es idempotente, lo que permite pintar arrastrando.
 * Devuelve el mismo objeto si nada cambia (mano o pincel inválidos incluidos).
 */
export function paintHand(hands, hand, brush, situationActions) {
  if (!isValidHand(hand)) return hands;
  const erase = brush === ERASE || brush === fallbackAction(situationActions);
  if (!erase && !isValidAction(brush, situationActions)) return hands;
  const current = hands?.[hand];
  if (erase ? current === undefined : current === brush) return hands;
  const next = { ...hands };
  if (erase) delete next[hand]; else next[hand] = brush;
  return next;
}

/** Dos rangos son iguales si todas las manos tienen la misma acción efectiva. */
export function rangesEqual(a, b, situationActions) {
  return allHands().every(h => actionFor(a, h, situationActions) === actionFor(b, h, situationActions));
}

/** Manos cuya acción efectiva no es la implícita, en orden de grid. */
export function explicitHands(hands, situationActions) {
  const implicit = fallbackAction(situationActions);
  return allHands().filter(h => actionFor(hands, h, situationActions) !== implicit);
}

/**
 * Frontera del rango: manos con acción implícita adyacentes (arriba, abajo, izquierda, derecha en el grid)
 * a alguna mano con acción explícita. Son las decisiones "juego / no juego" más fáciles de fallar.
 */
export function boundaryHands(hands, situationActions) {
  const explicit = new Set(explicitHands(hands, situationActions));
  const neighbours = hand => {
    const [r, c] = getCell(hand);
    return [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]
      .filter(([nr, nc]) => nr >= 0 && nr < 13 && nc >= 0 && nc < 13)
      .map(([nr, nc]) => getHand(nr, nc));
  };
  return allHands().filter(h => !explicit.has(h) && neighbours(h).some(n => explicit.has(n)));
}

/** Recuento de manos y combos por acción, incluyendo la implícita. */
export function summarize(hands, situationActions) {
  const byAction = {};
  for (const h of allHands()) {
    const a = actionFor(hands, h, situationActions);
    byAction[a] ??= { hands: 0, combos: 0 };
    byAction[a].hands += 1;
    byAction[a].combos += combos(h);
  }
  return byAction;
}

/**
 * Evalúa un intento del Builder contra el rango objetivo.
 * Compara la ACCIÓN EFECTIVA mano a mano (incluida la implícita), por lo que un rango
 * con varias acciones simultáneas (call + raise + all-in) se evalúa igual que uno simple.
 *
 * @returns {{ verdicts: {[hand]: {expected, given, correct}}, correct, total, accuracy, byAction }}
 */
export function evaluateRange(target, attempt, situationActions) {
  const verdicts = {};
  const byAction = {};
  let correct = 0;
  for (const h of allHands()) {
    const expected = actionFor(target, h, situationActions);
    const given = actionFor(attempt, h, situationActions);
    const ok = expected === given;
    verdicts[h] = { expected, given, correct: ok };
    byAction[expected] ??= { total: 0, correct: 0 };
    byAction[expected].total += 1;
    if (ok) { byAction[expected].correct += 1; correct += 1; }
  }
  return { verdicts, correct, total: 169, accuracy: correct / 169, byAction };
}

/**
 * Estadísticas para el panel del Explorer. Porcentajes sobre los 1326 combos.
 * hands/combos/pct cuentan las manos jugadas (acción distinta de la implícita);
 * byAction sigue el orden de acciones de la situación e incluye la implícita (implicit: true).
 */
export function rangeStats(hands, situationActions) {
  const implicit = fallbackAction(situationActions);
  const counts = summarize(hands, situationActions);
  const byAction = situationActions.map(action => {
    const c = counts[action] ?? { hands: 0, combos: 0 };
    return { action, hands: c.hands, combos: c.combos, pct: c.combos / TOTAL_COMBOS, implicit: action === implicit };
  });
  const played = byAction.filter(a => !a.implicit);
  const playedCombos = played.reduce((n, a) => n + a.combos, 0);
  return {
    hands: played.reduce((n, a) => n + a.hands, 0),
    combos: playedCombos,
    pct: playedCombos / TOTAL_COMBOS,
    byAction
  };
}

/**
 * Texto del rango para copiar: una línea por acción jugada con sus combos y manos
 * (parejas, suited, offsuit) y una línea final con la acción implícita.
 */
export function exportRange(hands, situationActions, { title } = {}) {
  const label = a => ACTION_LABELS[a] ?? a;
  const lines = title ? [title] : [];
  for (const a of rangeStats(hands, situationActions).byAction) {
    if (a.implicit || a.hands === 0) continue;
    const list = allHands().filter(h => actionFor(hands, h, situationActions) === a.action).sort(compareHands);
    lines.push(`${label(a.action)} (${a.combos} combos): ${list.join(', ')}`);
  }
  lines.push(`Resto: ${label(fallbackAction(situationActions))}`);
  return lines.join('\n');
}
