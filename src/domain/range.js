// range.js — un rango es { [hand]: action }. Funciones puras compartidas por Explorer, Quiz y Builder.
import { allHands, combos, getCell, getHand, isValidHand } from './hand';
import { fallbackAction, isValidAction } from './actions';

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
