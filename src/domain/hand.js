// hand.js — matriz 13x13 de manos preflop. Sin dependencias.
//
//   - Filas y columnas: A, K, Q, J, T, 9, 8, 7, 6, 5, 4, 3, 2
//   - Diagonal -> pareja (AA), triángulo superior -> suited (AKs), inferior -> offsuit (AKo)

export const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
export const HAND_RE = /^([AKQJT2-9])([AKQJT2-9])([so])?$/;

export function getHand(rowIdx, colIdx) {
  if (rowIdx === colIdx) return RANKS[rowIdx] + RANKS[colIdx];
  const high = RANKS[Math.min(rowIdx, colIdx)];
  const low = RANKS[Math.max(rowIdx, colIdx)];
  return high + low + (colIdx > rowIdx ? 's' : 'o');
}

export function getCell(hand) {
  if (!isValidHand(hand)) throw new Error(`Mano inválida: ${hand}`);
  const a = RANKS.indexOf(hand[0]);
  const b = RANKS.indexOf(hand[1]);
  if (hand.length === 2) return [a, b];
  const hi = Math.min(a, b), lo = Math.max(a, b);
  return hand[2] === 's' ? [hi, lo] : [lo, hi];
}

export function isValidHand(hand) {
  const m = typeof hand === 'string' && hand.match(HAND_RE);
  if (!m) return false;
  const pair = m[1] === m[2];
  if (pair) return m[3] === undefined;
  return m[3] !== undefined && RANKS.indexOf(m[1]) < RANKS.indexOf(m[2]);
}

/** Las 169 manos en orden de grid (fila a fila). */
export function allHands() {
  const out = [];
  for (let r = 0; r < 13; r++) for (let c = 0; c < 13; c++) out.push(getHand(r, c));
  return out;
}

/** Nº de combos: 6 pareja, 4 suited, 12 offsuit. */
export function combos(hand) {
  if (hand.length === 2) return 6;
  return hand[2] === 's' ? 4 : 12;
}

export const TOTAL_COMBOS = 1326;
