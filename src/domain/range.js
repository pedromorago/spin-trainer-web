// range.js — un rango es { [hand]: action }. Funciones puras compartidas por Explorer, Quiz y Builder.
import { allHands, combos, isValidHand } from './hand';
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
