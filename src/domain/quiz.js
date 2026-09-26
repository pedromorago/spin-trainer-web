// quiz.js — motor del Quiz. RNG inyectable para tests deterministas.
import { allHands } from './hand';
import { actionFor, boundaryHands, explicitHands } from './range';

/**
 * Manos que puede preguntar el Quiz.
 *  - 'range': manos con acción explícita + su frontera (entrena también la decisión de no jugar).
 *  - 'all':   las 169 manos.
 */
export function quizPool(range, actions, scope = 'range') {
  if (scope === 'all') return allHands();
  const pool = new Set([...explicitHands(range, actions), ...boundaryHands(range, actions)]);
  return allHands().filter(h => pool.has(h));
}

/**
 * @param {object} opts
 * @param {object} opts.range      rango objetivo { [hand]: action }
 * @param {string[]} opts.actions  acciones válidas de la situación
 * @param {() => number} [opts.rng] función en [0,1)
 * @param {'range'|'all'} [opts.scope] ver quizPool
 */
export function createQuizEngine({ range, actions, rng = Math.random, scope = 'range' }) {
  const pool = quizPool(range, actions, scope);
  if (pool.length === 0) throw new Error('Pool de manos vacío');
  let last = null;

  return {
    size: pool.length,
    /** Mano aleatoria del pool; nunca repite la anterior si hay alternativa. */
    nextHand() {
      const candidates = pool.length > 1 && last ? pool.filter(h => h !== last) : pool;
      last = candidates[Math.floor(rng() * candidates.length)];
      return last;
    },
    check(hand, given) {
      const expected = actionFor(range, hand, actions);
      return { hand, given, expected, correct: given === expected };
    }
  };
}
