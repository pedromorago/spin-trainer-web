// quiz.js — motor del Quiz. RNG inyectable para tests deterministas.
import { allHands } from './hand';
import { actionFor } from './range';

/**
 * @param {object} opts
 * @param {object} opts.range      rango objetivo { [hand]: action }
 * @param {string[]} opts.actions  acciones válidas de la situación
 * @param {() => number} [opts.rng] función en [0,1)
 * @param {boolean} [opts.onlyListed] limitar a manos con acción explícita
 */
export function createQuizEngine({ range, actions, rng = Math.random, onlyListed = false }) {
  const pool = onlyListed ? Object.keys(range) : allHands();
  if (pool.length === 0) throw new Error('Pool de manos vacío');

  return {
    nextHand() {
      return pool[Math.floor(rng() * pool.length)];
    },
    check(hand, given) {
      const expected = actionFor(range, hand, actions);
      return { hand, given, expected, correct: given === expected };
    }
  };
}
