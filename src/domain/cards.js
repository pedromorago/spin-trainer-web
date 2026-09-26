// cards.js — reparte las dos cartas concretas de una mano del grid con palos coherentes.
import { isValidHand } from './hand';

export const SUITS = ['s', 'h', 'd', 'c'];

/**
 * @param {string} hand  mano canónica ('AA', 'AKs', 'T9o')
 * @returns {[{rank, suit}, {rank, suit}]} carta alta primero. Pareja y offsuit: palos distintos; suited: el mismo palo.
 */
export function dealCards(hand, rng = Math.random) {
  if (!isValidHand(hand)) throw new Error(`Mano inválida: ${hand}`);
  const first = SUITS[Math.floor(rng() * 4)];
  const others = SUITS.filter(s => s !== first);
  const second = hand[2] === 's' ? first : others[Math.floor(rng() * 3)];
  return [{ rank: hand[0], suit: first }, { rank: hand[1], suit: second }];
}
