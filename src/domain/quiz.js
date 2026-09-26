// quiz.js — motor del Quiz: qué mano preguntar y cómo corregirla. Funciones puras con RNG inyectable.
//
// Un "spot" es una combinación con rango efectivo cargado: { situation, stack, actions, hands, source }.
// Una pregunta es { situation, stack, hand }.
import { allHands } from './hand';
import { actionFor, boundaryHands, explicitHands } from './range';
import { pickUniform, pickWeighted } from './random';

const spotKey = ({ situation, stack }) => `${situation}@${stack}`;

/**
 * Manos que puede preguntar el Quiz en un spot.
 *  - 'range': manos con acción explícita + su frontera (entrena también la decisión de no jugar).
 *  - 'all':   las 169 manos.
 */
export function quizPool(range, actions, scope = 'range') {
  if (scope === 'all') return allHands();
  const pool = new Set([...explicitHands(range, actions), ...boundaryHands(range, actions)]);
  return allHands().filter(h => pool.has(h));
}

/** Spots con algo que preguntar (rango con manos jugadas). */
export function playableSpots(spots) {
  return spots.filter(s => explicitHands(s.hands, s.actions).length > 0);
}

/**
 * Siguiente pregunta. Nunca repite la anterior si hay alternativa.
 *  - mode 'normal': spot uniforme entre los jugables y mano uniforme de su pool (`scope`).
 *  - mode 'hard':   mano difícil (domain/stats#hardHands) de alguno de los spots, con probabilidad ∝ peso.
 * @returns {{situation, stack, hand} | null} null si no hay nada que preguntar
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

/** Corrige una respuesta contra el rango efectivo del spot (la API vuelve a corregir al registrar el intento). */
export function checkAnswer(spot, hand, given) {
  const expected = actionFor(spot.hands, hand, spot.actions);
  return { hand, given, expected, correct: given === expected };
}
