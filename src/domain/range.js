// range.js — a range is { [hand]: action }. Pure functions shared by Explorer, Quiz and Builder.
import { allHands, combos, compareHands, getCell, getHand, isValidHand, TOTAL_COMBOS } from './hand';
import { ACTION_LABELS, fallbackAction, isValidAction } from './actions';

/** "Eraser" brush: returns the hand to the implicit action. */
// Stryker disable next-line StringLiteral: a sentinel; any value that is not an action code works the same.
export const ERASE = 'ERASE';

/**
 * Normalizes a range: removes invalid hands or hands with an action not allowed in the situation,
 * and drops the implicit action (it is not stored).
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

/** Effective action of a hand (explicit or implicit). */
export function actionFor(hands, hand, situationActions) {
  return hands?.[hand] ?? fallbackAction(situationActions);
}

/**
 * Paints a hand with the brush (an action of the situation) or erases it (ERASE or the implicit action).
 * Sets, does not toggle: repeating the stroke is idempotent, which allows painting by dragging.
 * Returns the same object if nothing changes (invalid hand or brush included).
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

/** Two ranges are equal if every hand has the same effective action. */
export function rangesEqual(a, b, situationActions) {
  return allHands().every(h => actionFor(a, h, situationActions) === actionFor(b, h, situationActions));
}

/** Hands whose effective action is not the implicit one, in grid order. */
export function explicitHands(hands, situationActions) {
  const implicit = fallbackAction(situationActions);
  return allHands().filter(h => actionFor(hands, h, situationActions) !== implicit);
}

/**
 * Range boundary: implicit-action hands adjacent (above, below, left, right in the grid)
 * to some hand with an explicit action. They are the easiest "play / don't play" decisions to get wrong.
 */
export function boundaryHands(hands, situationActions) {
  const explicit = new Set(explicitHands(hands, situationActions));
  const neighbours = hand => {
    const [r, c] = getCell(hand);
    const cells = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]];
    // Stryker disable next-line all: an off-grid "hand" is never in the explicit set, so this bound is not observable.
    const onGrid = cells.filter(([nr, nc]) => nr >= 0 && nr < 13 && nc >= 0 && nc < 13);
    return onGrid.map(([nr, nc]) => getHand(nr, nc));
  };
  return allHands().filter(h => !explicit.has(h) && neighbours(h).some(n => explicit.has(n)));
}

/** Count of hands and combos per action, including the implicit one. */
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

/** Verdict kinds of a played hand: correct, wrong action, extra (should be the implicit one) and missing (should be played). */
export const VERDICT_KINDS = ['correct', 'wrong', 'extra', 'missing'];

/**
 * Evaluates a Builder attempt against the target range.
 * Compares the EFFECTIVE ACTION hand by hand (implicit included), so a range
 * with several simultaneous actions (call + raise + all-in) is evaluated the same as a simple one.
 *
 * Each verdict carries `kind` (VERDICT_KINDS) and `played` (either of the two ranges plays the hand).
 * `score` only scores the played hands: with a tight range, getting the folds of the 169 right inflates `accuracy`.
 * Invariant: score.total = byKind.correct + byKind.wrong + byKind.extra + byKind.missing.
 *
 * @returns {{ verdicts: {[hand]: {expected, given, correct, kind, played}}, correct, total, accuracy,
 *             byAction: {[expected]: {total, correct}}, byKind: {[kind]: n}, score: {correct, total, accuracy} }}
 */
export function evaluateRange(target, attempt, situationActions) {
  const implicit = fallbackAction(situationActions);
  const verdicts = {};
  const byAction = {};
  const byKind = Object.fromEntries(VERDICT_KINDS.map(k => [k, 0]));
  let correct = 0;
  for (const h of allHands()) {
    const expected = actionFor(target, h, situationActions);
    const given = actionFor(attempt, h, situationActions);
    const ok = expected === given;
    const played = expected !== implicit || given !== implicit;
    const kind = ok ? 'correct' : expected === implicit ? 'extra' : given === implicit ? 'missing' : 'wrong';
    verdicts[h] = { expected, given, correct: ok, kind, played };
    byAction[expected] ??= { total: 0, correct: 0 };
    byAction[expected].total += 1;
    if (ok) { byAction[expected].correct += 1; correct += 1; }
    if (played) byKind[kind] += 1;
  }
  const scored = VERDICT_KINDS.reduce((n, k) => n + byKind[k], 0);
  return {
    verdicts, correct, total: 169, accuracy: correct / 169, byAction, byKind,
    score: { correct: byKind.correct, total: scored, accuracy: scored ? byKind.correct / scored : 1 }
  };
}

/**
 * Stats for the Explorer panel. Percentages over the 1326 combos.
 * hands/combos/pct count the played hands (action other than the implicit one);
 * byAction follows the action order of the situation and includes the implicit one (implicit: true).
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
 * Range text to copy: one line per played action with its combos and hands
 * (pairs, suited, offsuit) and a final line with the implicit action.
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

/**
 * Effective ranges of all combinations (ADR-0012): the custom range prevails over the reference one.
 * @param {Array} defaults reference ranges (GET /ranges/default)
 * @param {Array} users    custom ranges (GET /ranges/user)
 * @returns {Map<string, Range>} key `situation@stack`
 */
export function mergeEffectiveRanges(defaults = [], users = []) {
  const byCombo = new Map();
  for (const r of [...defaults, ...users]) byCombo.set(`${r.situation}@${r.stack}`, r);
  return byCombo;
}
