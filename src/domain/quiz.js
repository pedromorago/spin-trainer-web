// quiz.js — Quiz engine: which hand to ask and how to grade it. Pure functions with an injectable RNG.
//
// A "spot" is a combination with a loaded effective range: { situation, stack, actions, hands, source }.
// A question is { situation, stack, hand }.
import { allHands } from './hand';
import { actionFor, boundaryHands, explicitHands } from './range';
import { pickUniform, pickWeighted } from './random';

const spotKey = ({ situation, stack }) => `${situation}@${stack}`;

/**
 * Hands the Quiz can ask in a spot.
 *  - 'range': hands with an explicit action + their boundary (also trains the decision not to play).
 *  - 'all':   the 169 hands.
 */
export function quizPool(range, actions, scope = 'range') {
  if (scope === 'all') return allHands();
  const pool = new Set([...explicitHands(range, actions), ...boundaryHands(range, actions)]);
  return allHands().filter(h => pool.has(h));
}

/** Spots with something to ask (range with played hands). */
export function playableSpots(spots) {
  return spots.filter(s => explicitHands(s.hands, s.actions).length > 0);
}

/**
 * Next question. Never repeats the previous one if there is an alternative.
 *  - mode 'normal': uniform spot among the playable ones and uniform hand from its pool (`scope`).
 *  - mode 'hard':   hard hand (domain/stats#hardHands) from any of the spots, with probability ∝ weight.
 * @returns {{situation, stack, hand} | null} null if there is nothing to ask
 */
export function nextQuestion({ spots, mode = 'normal', scope = 'range', hard = [], previous = null, rng = Math.random }) {
  const same = q => previous && spotKey(q) === spotKey(previous) && q.hand === previous.hand;

  if (mode === 'hard') {
    const keys = new Set(playableSpots(spots).map(spotKey));
    const candidates = hard.filter(h => keys.has(spotKey(h)));
    const fresh = candidates.length > 1 ? candidates.filter(h => !same(h)) : candidates;
    const pick = pickWeighted(fresh, h => h.weight, rng);
    return pick && { situation: pick.situation, stack: pick.stack, hand: pick.hand };
  }

  const spot = pickUniform(playableSpots(spots), rng);
  if (!spot) return null;
  const pool = quizPool(spot.hands, spot.actions, scope);
  const fresh = pool.length > 1 ? pool.filter(hand => !same({ ...spot, hand })) : pool;
  return { situation: spot.situation, stack: spot.stack, hand: pickUniform(fresh, rng) };
}

/** Grades an answer against the effective range of the spot (the API grades it again when recording the attempt). */
export function checkAnswer(spot, hand, given) {
  const expected = actionFor(spot.hands, hand, spot.actions);
  return { hand, given, expected, correct: given === expected };
}
